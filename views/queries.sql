-- Tabela Users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    user_nome VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    telemovel VARCHAR(15),
    nif VARCHAR(15),
    morada TEXT,
    qualificacao TEXT,
    vendedor BOOLEAN DEFAULT FALSE,
    img_user TEXT,
    administrador BOOLEAN DEFAULT FALSE,
    password VARCHAR(255) NOT NULL
);

-- Tabela Categories
CREATE TABLE categoria (
    cat_id SERIAL PRIMARY KEY,
    cat_nome VARCHAR(100)
);

-- Inserir em categorias
INSERT INTO categoria (cat_nome)
VALUES ('Acrílico'), ('Aguarela'), ('Carvão'), ('Óleo');

-- Tabela Artigos
CREATE TABLE artigo (
    art_id SERIAL PRIMARY KEY,
    nome VARCHAR(255),
    img TEXT,
    preco DECIMAL(10, 2),
    vendido BOOLEAN DEFAULT FALSE,
    quantidade INT,
    descricao TEXT,
    user_id INT,
    cat_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (cat_id) REFERENCES categoria(cat_id)
);

-- Tabela Pedidos
CREATE TABLE pedido (
    pedido_id SERIAL PRIMARY KEY,
    pedido_data DATE DEFAULT CURRENT_TIMESTAMP,
    quantidade INT,
    email VARCHAR(100),
    morada TEXT,
    codigoPostal VARCHAR(7),
    metodoPagamento VARCHAR(50),
    preco DECIMAL(10, 2),
    art_id INT,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (art_id) REFERENCES artigo(art_id)
);

