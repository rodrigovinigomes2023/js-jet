"""js-jet — contas e ranking (10/11/2026).

SQLite em servidor/dados/jsjet.db. Senha guardada só como hash scrypt com sal (nunca em texto).
Sessão = token aleatório guardado no navegador (localStorage), vale 180 dias.
Ranking separado por sala ('pvp' = sala sem bots, 'bots' = sala com bots).
"""
import hashlib, hmac, os, re, secrets, sqlite3, time
from pathlib import Path

PASTA = Path(__file__).resolve().parent / 'dados'
PASTA.mkdir(exist_ok=True)
DB = sqlite3.connect(os.environ.get('JSJET_DB') or PASTA / 'jsjet.db',   # JSJET_DB: banco de teste
                      isolation_level=None, check_same_thread=False)
DB.row_factory = sqlite3.Row
DB.executescript('''
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
VALIDADE = 180 * 86400
NOME_OK = re.compile(r'^[0-9A-Za-zÀ-ÿ _\-]{3,16}$')
SENHA_MIN = 4


def _hash(senha, sal):
    return hashlib.scrypt(senha.encode(), salt=sal, n=2 ** 14, r=8, p=1, dklen=32)


def _sessao(conta_id):
    tok = secrets.token_urlsafe(24)
    DB.execute('INSERT INTO sessoes VALUES(?,?,?)', (tok, conta_id, time.time()))
    return tok


def criar(nome, senha):
    """-> (token, nome) ou levanta ValueError com a mensagem para o jogador."""
    nome = ' '.join(str(nome or '').split())
    senha = str(senha or '')
    if not NOME_OK.match(nome):
        raise ValueError('Nome: 3 a 16 letras, números, espaço, _ ou -')
    if len(senha) < SENHA_MIN or len(senha) > 100:
        raise ValueError(f'Senha: pelo menos {SENHA_MIN} caracteres')
    if DB.execute('SELECT 1 FROM contas WHERE nome=?', (nome,)).fetchone():
        raise ValueError('Esse nome já tem dono')
    sal = secrets.token_bytes(16)
    cur = DB.execute('INSERT INTO contas(nome,hash,sal,criado) VALUES(?,?,?,?)', (nome, _hash(senha, sal), sal, time.time()))
    return _sessao(cur.lastrowid), nome


def entrar(nome, senha):
    r = DB.execute('SELECT * FROM contas WHERE nome=?', (' '.join(str(nome or '').split()),)).fetchone()
    if not r or not hmac.compare_digest(_hash(str(senha or ''), r['sal']), r['hash']):
        raise ValueError('Nome ou senha errados')
    return _sessao(r['id']), r['nome']


def por_token(tok):
    """-> (id, nome) da conta, ou None se o token não vale."""
    if not tok or not isinstance(tok, str) or len(tok) > 64:
        return None
    r = DB.execute('SELECT c.id, c.nome, s.criado FROM sessoes s JOIN contas c ON c.id=s.conta WHERE s.token=?', (tok,)).fetchone()
    if not r or time.time() - r['criado'] > VALIDADE:
        return None
    return r['id'], r['nome']


def sair(tok):
    DB.execute('DELETE FROM sessoes WHERE token=?', (str(tok or ''),))


def _garante(conta, sala):
    DB.execute('INSERT OR IGNORE INTO stats(conta,sala) VALUES(?,?)', (conta, sala))


def somar(conta, sala, **campos):
    if not conta or sala.startswith('m:'):   # (19/11) missões não entram no ranking
        return
    _garante(conta, sala)
    sets = ', '.join(f'{k}={k}+?' for k in campos)
    DB.execute(f'UPDATE stats SET {sets} WHERE conta=? AND sala=?', (*campos.values(), conta, sala))


def recorde_seq(conta, sala, seq):
    if conta and not sala.startswith('m:'):
        _garante(conta, sala)
        DB.execute('UPDATE stats SET melhor_seq=MAX(melhor_seq,?) WHERE conta=? AND sala=?', (seq, conta, sala))


def ranking(sala, n=30):
    rows = DB.execute('''SELECT c.nome, s.abates, s.abates_missil, s.mortes, s.partidas, s.tempo, s.melhor_seq
        FROM stats s JOIN contas c ON c.id=s.conta WHERE s.sala=? AND (s.abates>0 OR s.mortes>0)
        ORDER BY s.abates DESC, (s.abates*1.0/MAX(s.mortes,1)) DESC, s.mortes ASC LIMIT ?''', (sala, n)).fetchall()
    return [dict(r) for r in rows]


# (19/11) modo história: melhor resultado de cada missão (estrelas e tempo)
def missoes_de(conta):
    """-> {n: estrelas} das missões cumpridas."""
    return {r['n']: r['estrelas'] for r in DB.execute('SELECT n, estrelas FROM missoes WHERE conta=?', (conta,))}


def missao_feita(conta, n, estrelas, tempo):
    if not conta:
        return
    DB.execute('''INSERT INTO missoes VALUES(?,?,?,?) ON CONFLICT(conta, n) DO UPDATE SET
        estrelas=MAX(estrelas, excluded.estrelas), tempo=MIN(tempo, excluded.tempo)''', (conta, n, estrelas, tempo))
