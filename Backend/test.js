const pl = require("tau-prolog");

// 1. Creamos la sesión
const session = pl.create();

// 2. Programa Prolog
const program = `
progenitor(carlos, patricia).
progenitor(carlos, ana).
progenitor(maria, ana).
progenitor(ana,alfredo).
progenitor(ana, morgan).
progenitor(morgan, yaqui).
hombre(carlos).
hombre(alfredo).
hombre(morgan).
mujer(maria).
mujer(patricia).
mujer(ana).
mujer(yaqui).


%reglas
abuelo(X,Y):-progenitor(X,Z),progenitor(Z,Y).
tio(X,Y):-progenitor(Z,Y), progenitor(V,Z),progenitor(V,X),z\=X.
bisabuelo(X,Y):-progenitor(X,A),progenitor(A,B),progenitor(B,Y).

dif(X,Y):-X\=Y.
es_madre(X):- progenitor(X,_), mujer(X).
es_padre(X):- progenitor(X,_), hombre(X).
es_hijo(X):- progenitor(_,X).
es_hermana(X,Y):- progenitor(Z,X),progenitor(Z,Y),mujer(X),dif(X,Y).
`;

const query = () => { 
    session.query("abuelo(X,Y).", {
    success: function() { 
        session.answer({
        success: function(answer) {
            console.log(session.format_answer(answer)); // formato X = resultado
        },
        fail: function() { /* No more answers */ },
        error: function(err) { /* Uncaught exception */ },
        limit: function() { /* Limit exceeded */ }
    });
    },
    });
};

// 3. Cargamos el programa
session.consult(program, {
    success: function() {
        query();// 4. Hacemos la consulta (Query)
    },
    error: function(err) { console.error("Error en el programa:", err); }
});

