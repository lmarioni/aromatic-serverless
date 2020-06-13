"use strict";
const chromium = require("chrome-aws-lambda");
var AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

AWS.config.update({ region: "us-east-1" });
const s3 = new AWS.S3();

'use strict';

module.exports.invoice = async (event, context, callBack) => {
console.log('hola')
// {{!-- width:100%; max-width:300px; --}}
  const data = {
    filename: "mono.pdf",
    from: { 
      nombre: 'Lucas Marioni',
      email: 'l@mimenu.digital',
      ciudad: 'Almeria',
      direccion: 'San Luis 62',
      logo: 'http://hybl-aromas.com/wp-content/uploads/2017/08/Logo.png',
      nombreFantasia: 'ServiAroma' },
    to: { 
        nombre: 'Aparte diseño e impresion, s.c. ',
        email: '',
        localidad: 'Guadix',
        direccion: 'C/ san torcuato, 11',
        nombreFantasia: '' 
    },
    nserie: 1,
    numeroFactura: 120,
    fecha: '10-06-2020',
    items: [
      {
        cantidad: 1,
        descripcion: "Producto nuevo",
        precio: 100,
        total: 100
      },
      {
        cantidad: 2,
        descripcion: "Recarga atomática",
        precio: 200,
        total: 400
      }
    ],
    totalSinIva: 500, 
    ivaTotal: 105, 
    totalConIva: 605 
  }
  // const data = JSON.parse(event.body)
  console.log(data)
  const executablePath =  await chromium.executablePath;
  const file = fs.readFileSync(path.resolve(__dirname, "template.hbs"), 'utf8')
  const template = handlebars.compile(file)
  const html = template(data)
  const response = {
    headers: {
      "Content-type": "text/html"
    },
    statusCode: 200,
    body: html
  };
  return response

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
      margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" }
    });

    // TODO: Response with PDF (or error if something went wrong )
    const response = {
      headers: {
        "Content-type": "application/json",
        "content-disposition": "attachment; filename=test.pdf"
      },
      statusCode: 200,
      body: "{'hola':'como'}",
      isBase64Encoded: true
    };

    const output_filename = 'pdf-demo.pdf';

    const s3Params = {
      Bucket: "matic-invoices",
      Key: `public/${output_filename}`,
      Body: pdf,
      ContentType: "application/pdf",
      ServerSideEncryption: "AES256"
    };

    // s3.putObject(s3Params, err => {
    //   if (err) {
    //     console.log("err", err);
    //     return callBack(null, { error });
    //   }
    // });

    context.succeed(response);

  } catch (error) {
    return context.fail(error);
  } finally {
    // if (browser !== null) {
    //   await browser.close();
    // }
  }
};