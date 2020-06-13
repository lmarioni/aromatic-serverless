"use strict";
const chromium = require("chrome-aws-lambda");
var AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

AWS.config.update({ region: "us-east-1" });
const s3 = new AWS.S3();


module.exports.pdf = async (event, context, callBack) => {

  // const data ={
  //   filename: "mono.pdf",
  //   from: { 
  //     nombre: 'Lucas Marioni',
  //     email: 'l@mimenu.digital',
  //     ciudad: 'Almeria',
  //     direccion: 'San Luis 62',
  //     logo: 'http://hybl-aromas.com/wp-content/uploads/2017/08/Logo.png',
  //     nombreFantasia: 'ServiAroma' },
  //   to: { 
  //       nombre: 'Aparte diseño e impresion, s.c. ',
  //       email: '',
  //       localidad: 'Guadix',
  //       direccion: 'C/ san torcuato, 11',
  //       nombreFantasia: '' 
  //   },
  //   nserie: 1,
  //   numeroFactura: 120,
  //   fecha: '10-06-2020',
  //   items: [
  //     {
  //       cantidad: 1,
  //       descripcion: "Producto nuevo",
  //       precio: 100,
  //       total: 100
  //     },
  //     {
  //       cantidad: 2,
  //       descripcion: "Recarga atomática",
  //       precio: 200,
  //       total: 400
  //     }
  //   ],
  //   totalSinIva: 500, 
  //   ivaTotal: 105, 
  //   totalConIva: 605 
  // }
  const data = JSON.parse(event.body)
  console.log(data)
  const executablePath =  await chromium.executablePath;
  const file = fs.readFileSync(path.resolve(__dirname, "template.hbs"), 'utf8')
  const template = handlebars.compile(file)
  const html = template(data)

  let browser = null;
  
  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless
    });

    const page = await browser.newPage();

    page.setContent(html);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0cm", right: "0cm", bottom: "0cm", left: "0cm" }
    });

    const s3Params = {
      Bucket: "matic-invoices",
      Key: data.filename,
      Body: pdf,
      ContentType: "application/pdf",
      ServerSideEncryption: "AES256"
    };

    await s3.putObject(s3Params).promise();
    
    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          status: 'success',
          url: `https://matic-invoices.s3.amazonaws.com/${data.filename}`
        },
        null,
        2
      ),
    };
    
    // context.succeed(respuesta);

  } catch (error) {
    return context.fail(error);
  } finally {
    if (browser !== null) {
     await browser.close();
    }
  }
};