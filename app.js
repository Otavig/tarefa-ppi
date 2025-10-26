import express from "express";

const app = express();
const PORT = 3000;

function paginaHTML(idade, sexo, salarioBase, anoContratacao, matricula, salarioReajustado) {
    return `
 <!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resultado do Reajuste</title>
</head>
<style>
    * {
        font-family: Arial, Helvetica, sans-serif;
        margin: 0px;
        padding: 0;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .container {
        opacity: 0;
        animation: fadeIn 1s forwards;
    }

    .container p {
        margin-top: 10px;
    }

    .container h1 {
        margin-bottom: 12px;
    }

    .container hr {
        margin-bottom: 25px;
    }
</style>
<body style="display: flex; width: 100vw; height: 100vh; justify-content: center; align-items: center; background-color: antiquewhite;">
    <div class="container" style="
            border: 1px solid rgba(0, 0, 0, 0.781); padding: 30px; width: 60vw; background-color: white; border-radius: 3px; box-shadow: 10px 10px 10px rgba(0, 0, 0, 0.195);
        ">
        <h1 style="text-align: 'center'">SALÁRIO REAJUSTADO</h1>
        <hr>
        <h2>Dados usufruídos: </h2>
        <p style="margin-left: 40px"><strong>- Idade: </strong> ${idade}</p>
        <p style="margin-left: 40px"><strong>- Sexo:</strong> ${sexo}</p>
        <p style="margin-left: 40px"><strong>- Salário Base:</strong> R$ ${salarioBase.toFixed(2)}</p>
        <p style="margin-left: 40px"><strong>- Ano de Contratação:</strong> ${anoContratacao}</p>
        <p style="margin-left: 40px"><strong>- Matrícula:</strong> ${matricula}</p>
        <br>
        <hr style="width: 40vw">
        <p style><strong>Resultado Final Do Salário Reajustado:</strong> R$ ${salarioReajustado}</p>
    </div>
</body>

</html>
    `;
}

function FPorcentagem(porcentagem) {
    return porcentagem / 100;
}

function reajuste(valor, porcentagem) {
    return (valor * FPorcentagem(porcentagem)) + valor;
}

function reajustarSalario(valorDesconto, valorAcrescimo, porcentagem, anosEmpresa, salarioBase) {
    return anosEmpresa > 10 ? reajuste(salarioBase, porcentagem) - valorDesconto : reajuste(salarioBase, porcentagem) + valorAcrescimo;
}

function camposFaltando(campos) {
    let faltando = [];

    for (const campo in campos) {
        if (!campos[campo]) {
            faltando.push(campo);
        }
    }

    return faltando.join(", ");
}

app.get("/reajuste", (req, res) => {
    try {
        let { idade, sexo, salarioBase, anoContratacao, matricula } = req.query;

        salarioBase = parseFloat(salarioBase);
        idade = Number(idade);
        anoContratacao = Number(anoContratacao);
        matricula = Number(matricula);

        let resultadoFinal = { salarioReajuste: salarioBase };
        let erros = [];

        if (!idade || !sexo || !salarioBase || !anoContratacao || !matricula) {
            let cf = camposFaltando({ idade, sexo, salarioBase, anoContratacao, matricula }), verificacao = cf.split(',').length>1;
            erros.push(`Inválido! ${verificacao ? "Os campos" : "O campo"} <p style="color: black">${cf}</p> ${verificacao ? "Estão" : "Está"} faltando...`);
        }
        if (salarioBase <= 0) erros.push("Inválido! Salário abaixo do mínimo de R$1,00...");
        if (isNaN(salarioBase)) erros.push("Inválido! Salário não veio como número...");
        if (idade <= 16) erros.push("Inválido! Menor ou igual que 16 anos..");
        if (anoContratacao <= 1960) erros.push("Inválido! O ano de contratação deve ser maior que 1960...");
        if (matricula <= 0) erros.push("Inválido! Número de matricula deve ser maior que 0...");

        if(erros.length > 0) {
            return res.send(`
                <!DOCTYPE html>
                <html lang="pt-br">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Reajuste salarial com erro</title>
                </head>
                <style>
                    * {
                        font-family: Arial, Helvetica, sans-serif;
                        margin: 0px;
                        padding: 0;
                    }
                </style>
                <body style="background-color: antiquewhite; padding: 2%">
                    <strong>
                        ${
                            erros.map(e => `<li style="color: red">${e}</li>`).join('')
                        }
                    </strong>
                </body>
                </html>    
            `);
        }

        const data = new Date().getFullYear();
        const anosEmpresa = data - anoContratacao;

        if (idade >= 18 && idade <= 39) {
            resultadoFinal.salarioReajuste = reajustarSalario(
                sexo === "m" ? 10 : 11, // Desconto
                sexo === "m" ? 17 : 16, // Acréscimo
                sexo === "m" ? 10 : 8,  // Porcentagem de reajuste
                anosEmpresa,
                salarioBase
            );
        } else if (idade >= 40 && idade <= 69) {
            resultadoFinal.salarioReajuste = reajustarSalario(
                sexo === "m" ? 5 : 7,  // Desconto
                sexo === "m" ? 15 : 14, // Acréscimo
                sexo === "m" ? 8 : 10, // Porcentagem de reajuste
                anosEmpresa,
                salarioBase
            );
        } else if (idade >= 70 && idade <= 99) {
            resultadoFinal.salarioReajuste = reajustarSalario(
                sexo === "m" ? 15 : 17, // Desconto
                sexo === "m" ? 13 : 12, // Acréscimo
                sexo === "m" ? 15 : 17, // Porcentagem de reajuste
                anosEmpresa,
                salarioBase
            );
        }

        resultadoFinal.salarioReajuste = Number(resultadoFinal.salarioReajuste).toFixed(2);

        return res.send(paginaHTML(idade, sexo === "m" ? "Masculino" : "Feminino", salarioBase, anoContratacao, matricula, resultadoFinal.salarioReajuste));
   } catch (error) {
        console.log(error);
   }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});