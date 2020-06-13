'use strict';

module.exports.hello = async (event, context, callBack) => {

  const item = JSON.parse(event.body)
    //   s3.putObject(s3Params, err => {
    //     if (err) {
    //       console.log("err", err);
    //       return callBack(null, { error });
    //     }
    //   });
    // });
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'hello! its working',
        items: item
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
