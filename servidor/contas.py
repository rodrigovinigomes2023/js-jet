"""js-jet — contas e ranking (10/11/2026).

Em casa: SQLite em servidor/dados/jsjet.db. Na nuvem (19/11): Postgres (Neon) se DATABASE_URL existir,
porque o disco do Render grátis é apagado a cada reinício.
Senha guardada só como hash scrypt com sal (nunca em texto).
Sessão = token aleatório guardado no navegador (localStorage), vale 180 dias.
Ranking separado por sala ('pvp' = deathmatch, 'bots' = sala com bots).
O SQL abaixo é o mesmo nos dois bancos (sem MAX/MIN de 2 valores, sem INSERT OR IGNORE).
"""
import hashlib, hmac, os, re, secrets, threading, time
from pathlib import Path

URL = os.environ.get('DATABASE_URL')


class _SQLite:
    def __init__(self):
        import sqlite3
        pasta = Path(__file__).resolve().parent / 'dados'
        pasta.mkdir(exist_ok=True)
        self.c = sqlite3.connect(os.environ.get('JSJET_DB') or pasta / 'jsjet.db',   # JSJET_DB: banco de teste
                                 isolation_level=None, check_same_thread=False)
        self.c.row_factory = sqlite3.Row
        self.c.executescript('''
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS contas(id INTEGER PRIMARY KEY, nome TEXT UNIQUE COLLATE NOCASE NOT NULL,
  hash BLOB NOT NULL, sal BLOB NOT NULL, criado REAL NOT NULL);
CREATE TABLE IF NOT EXISTS sessoes(token TEXT PRIMARY KEY, conta INTEGER NOT NULL, criado REAL NOT NULL);
CREATE TABLE IF NOT EXISTS stats(conta INTEGER NOT NULL, sala TEXT NOT NULL, abates INTEGER DEFAULT 0,
  abates_missil INTEGER DEFAULT 0, mortes INTEGER DEFAULT 0, partidas INTEGER DEFAULT 0,
  tempo REAL DEFAULT 0, melhor_seq INTEGER DEFAULT 0, PRIMARY KEY(conta, sala));
CREATE TABLE IF NOT EXISTS missoes(conta INTEGER NOT NULL, n INTEGER NOT NULL, estrelas INTEGER NOT NULL,
  tempo REAL NOT NULL, PRIMARY KEY(conta, n));
''')

    def q(self, sql, args=()):
        return [dict(r) for r in self.c.execute(sql, args).fetchall()]


class _Postgres:
    DDL = '''
CREATE TABLE IF NOT EXISTS contas(id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, nome TEXT NOT NULL,
  hash BYTEA NOT NULL, sal BYTEA NOT NULL, criado DOUBLE PRECISION NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS contas_nome ON contas(lower(nome));
CREATE TABLE IF NOT EXISTS sessoes(token TEXT PRIMARY KEY, conta BIGINT NOT NULL, criado DOUBLE PRECISION NOT NULL);
CREATE TABLE IF NOT EXISTS stats(conta BIGINT NOT NULL, sala TEXT NOT NULL, abates INTEGER DEFAULT 0,
  abates_missil INTEGER DEFAULT 0, mortes INTEGER DEFAULT 0, partidas INTEGER DEFAULT 0,
  tempo DOUBLE PRECISION DEFAULT 0, melhor_seq INTEGER DEFAULT 0, PRIMARY KEY(conta, sala));
CREATE TABLE IF NOT EXISTS missoes(conta BIGINT NOT NULL, n INTEGER NOT NULL, estrelas INTEGER NOT NULL,
  tempo DOUBLE PRECISION NOT NULL, PRIMARY KEY(conta, n));
'''

    def __init__(self):
        self.trava = threading.Lock()
        self.c = None
        self._liga()
        for cmd in self.DDL.split(';'):
            if cmd.strip():
                self.q(cmd)

    def _liga(self):
        import psycopg
        from psycopg.rows import dict_row
        self.c = psycopg.connect(URL, autocommit=True, row_factory=dict_row, connect_timeout=15)

    def q(self, sql, args=()):
        import psycopg
        sql = sql.replace('?', '%s')
        with self.trava:
            for tentativa in (1, 2):   # o Neon derruba conexão parada: reconecta 1 vez
                try:
                    if self.c is None or self.c.closed:
                        self._liga()
                    cur = self.c.execute(sql, args)
                    rows = cur.fetchall() if cur.description else []
                    return [{k: (bytes(v) if isinstance(v, memoryview) else v) for k, v in r.items()} for r in rows]
                except psycopg.OperationalError:
                    try:
                        self.c.close()
                    except Exception:
                        pass
                    self.c = None
                    if tentativa == 2:
                        raise


DB = _Postgres() if URL else _SQLite()
print('contas: banco', 'Postgres' if URL else 'SQLite', flush=True)
VALIDADE = 180 * 86400
NOME_OK = re.compile(r'^[0-9A-Za-zÀ-ÿ _\-]{3,16}$')
SENHA_MIN = 4


def _um(sql, args=()):
    r = DB.q(sql, args)
    return r[0] if r else None


def _hash(senha, sal):
    return hashlib.scrypt(senha.encode(), salt=sal, n=2 ** 14, r=8, p=1, dklen=32)


def _sessao(conta_id):
    tok = secrets.token_urlsafe(24)
    DB.q('INSERT INTO sessoes VALUES(?,?,?)', (tok, conta_id, time.time()))
    return tok


def criar(nome, senha):
    """-> (token, nome) ou levanta ValueError com a mensagem para o jogador."""
    nome = ' '.join(str(nome or '').split())
    senha = str(senha or '')
    if not NOME_OK.match(nome):
        raise ValueError('Nome: 3 a 16 letras, números, espaço, _ ou -')
    if len(senha) < SENHA_MIN or len(senha) > 100:
        raise ValueError(f'Senha: pelo menos {SENHA_MIN} caracteres')
    if _um('SELECT 1 AS x FROM contas WHERE lower(nome)=lower(?)', (nome,)):
        raise ValueError('Esse nome já tem dono')
    sal = secrets.token_bytes(16)
    r = _um('INSERT INTO contas(nome,hash,sal,criado) VALUES(?,?,?,?) RETURNING id', (nome, _hash(senha, sal), sal, time.time()))
    return _sessao(r['id']), nome


def entrar(nome, senha):
    r = _um('SELECT * FROM contas WHERE lower(nome)=lower(?)', (' '.join(str(nome or '').split()),))
    if not r or not hmac.compare_digest(_hash(str(senha or ''), bytes(r['sal'])), bytes(r['hash'])):
        raise ValueError('Nome ou senha errados')
    return _sessao(r['id']), r['nome']


def por_token(tok):
    """-> (id, nome) da conta, ou None se o token não vale."""
    if not tok or not isinstance(tok, str) or len(tok) > 64:
        return None
    r = _um('SELECT c.id, c.nome, s.criado FROM sessoes s JOIN contas c ON c.id=s.conta WHERE s.token=?', (tok,))
    if not r or time.time() - r['criado'] > VALIDADE:
        return None
    return r['id'], r['nome']


def sair(tok):
    DB.q('DELETE FROM sessoes WHERE token=?', (str(tok or ''),))


def _garante(conta, sala):
    DB.q('INSERT INTO stats(conta,sala) VALUES(?,?) ON CONFLICT DO NOTHING', (conta, sala))


def somar(conta, sala, **campos):
    if not conta or sala.startswith('m:'):   # (19/11) missões não entram no ranking
        return
    _garante(conta, sala)
    sets = ', '.join(f'{k}={k}+?' for k in campos)
    DB.q(f'UPDATE stats SET {sets} WHERE conta=? AND sala=?', (*campos.values(), conta, sala))


def recorde_seq(conta, sala, seq):
    if conta and not sala.startswith('m:'):
        _garante(conta, sala)
        DB.q('UPDATE stats SET melhor_seq=CASE WHEN melhor_seq>? THEN melhor_seq ELSE ? END WHERE conta=? AND sala=?',
             (seq, seq, conta, sala))


def ranking(sala, n=30):
    return DB.q('''SELECT c.nome, s.abates, s.abates_missil, s.mortes, s.partidas, s.tempo, s.melhor_seq
        FROM stats s JOIN contas c ON c.id=s.conta WHERE s.sala=? AND (s.abates>0 OR s.mortes>0)
        ORDER BY s.abates DESC, (s.abates*1.0/(CASE WHEN s.mortes>1 THEN s.mortes ELSE 1 END)) DESC, s.mortes ASC LIMIT ?''', (sala, n))


# (19/11) modo história: melhor resultado de cada missão (estrelas e tempo)
def missoes_de(conta):
    """-> {n: estrelas} das missões cumpridas."""
    return {r['n']: r['estrelas'] for r in DB.q('SELECT n, estrelas FROM missoes WHERE conta=?', (conta,))}


def missao_feita(conta, n, estrelas, tempo):
    if not conta:
        return
    DB.q('''INSERT INTO missoes VALUES(?,?,?,?) ON CONFLICT(conta, n) DO UPDATE SET
        estrelas=CASE WHEN missoes.estrelas>excluded.estrelas THEN missoes.estrelas ELSE excluded.estrelas END,
        tempo=CASE WHEN missoes.tempo<excluded.tempo THEN missoes.tempo ELSE excluded.tempo END''', (conta, n, estrelas, tempo))
