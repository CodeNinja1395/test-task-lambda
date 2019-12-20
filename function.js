'use strict';
const  AWS = require("aws-sdk");

const getFileAndParse = require("./executeFile");

const s3 = new AWS.S3();  

module.exports.writeToDb = async (event, context) => {

  try {
    await getFileAndParse();
  } catch (error) {
    throw error;
  }
  
  return {
      statusCode: 200,
      body: JSON.stringify({
          message: 'Data is uploaded successfully'
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};