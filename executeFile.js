const AWS = require("aws-sdk");
const { createConnection } = require("mysql");
const csv = require("csv-parser");
const util = require("util");

const s3 = new AWS.S3();

const connection = createConnection({
  host: '😶',
  user: '😶',
  password: '😶',
  database: '😶'
});

const params = {
  Bucket: "test-task-bucket-1395",
  Key: "test_project_addresses.csv"
}

module.exports = async () => {
  let dataBatch = [];

  return new Promise((resolve, reject) => {
    s3.getObject(params).createReadStream().pipe(csv())
      .on("data", async ({ address, city, state, zip }) => {
        dataBatch.push([address, city, state, zip])

        if (dataBatch.length === 1000) {
          try {
            await writeToDb(dataBatch);
          } catch (error) {
            reject(error);
          }

          dataBatch = [];
        }
      })
      .on("end", async () => {
        try {
          await writeToDb(dataBatch);
        } catch (error) {
          reject(error);
        }

        resolve();
      })
      .on("error", error => {
        reject(error);
      });
  });

}

async function writeToDb(values) {
  // another efficient way to ignore duplicates is to add primary key on table and do INSERT ON DUPLICATE KEY UPDATE in sql query
  const data = removeDuplicates(values);

  const sql = "INSERT INTO Addresses (address, city, state, zip) VALUES ?"
  const query = util.promisify(connection.query).bind(connection);

  try {
    await query(sql, [data]);
  } catch (error) {
    console.log("error");
    
    throw error;
  }
}

function removeDuplicates(arr) { // this one from stackoverflow

  const result = [];
  const duplicatesIndices = [];

  // Loop through each item in the original array
  arr.forEach((current, index) => {

    if (duplicatesIndices.includes(index)) return;

    result.push(current);

    // Loop through each other item on array after the current one
    for (let comparisonIndex = index + 1; comparisonIndex < arr.length; comparisonIndex++) {

      const comparison = arr[comparisonIndex];
      const currentKeys = Object.keys(current);
      const comparisonKeys = Object.keys(comparison);

      // Check number of keys in objects
      if (currentKeys.length !== comparisonKeys.length) continue;

      // Check key names
      const currentKeysString = currentKeys.sort().join("").toLowerCase();
      const comparisonKeysString = comparisonKeys.sort().join("").toLowerCase();
      if (currentKeysString !== comparisonKeysString) continue;

      // Check values
      let valuesEqual = true;
      for (let i = 0; i < currentKeys.length; i++) {
        const key = currentKeys[i];
        if (current[key] !== comparison[key]) {
          valuesEqual = false;
          break;
        }
      }
      if (valuesEqual) duplicatesIndices.push(comparisonIndex);

    } // end for loop

  }); // end arr.forEach()

  return result;
}