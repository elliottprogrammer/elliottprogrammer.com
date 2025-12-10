const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
    const directoryPath = '../git-contribution-data';
    let contributions = [];

    try {
        const files = fs.readdirSync(directoryPath);
    
        for (const file of files) {
            const fullPath = path.join(directoryPath, file);
            const yearMatch = file.match(/contributions-([\d]+)\.json$/);
            const year = yearMatch && yearMatch.length && yearMatch[1];
    
            const stats = fs.statSync(fullPath);
            // Skip the iteration if it's not a file (i.e.- it's a directory)
            // or if the file doesn't match.
            if ( !stats.isFile() || !year ) {
                continue;
            }
            // Read the git contribution "year" file.
            fs.readFile(fullPath, 'utf8', (err, data) => {
                if (err) {
                    return {
                        status: "error",
                        statusCode: 500,
                        error: {
                            code: "FILE_READ_ERROR",
                            message: "An unexpected error occurred while attempting to read the file.",
                            details: err
                        }
                      };
                }
                try {
                    const jsonObject = JSON.parse(data);
                    const totalContributions =  jsonObject.data.user.contributionsCollection.contributionCalendar.totalContributions
                    const weeks = jsonObject.data.user.contributionsCollection.contributionCalendar.weeks;
                    const contributionObject = {
                        year: year,
                        total_contributions: totalContributions,
                        weeks: weeks,
                    }
                    contributions.push(contributionObject);
                } catch (parseError) {
                    return {
                        status: "Bad Request",
                        statusCode: 400,
                        error: {
                            code: "INVALID_JSON",
                            message: "An unexpected error occurred while attempting to parse the JSON.",
                            details: parseError
                        }
                      };
                }
            });
        }

    } catch (parseError) {
        return {
            status: "Bad Request",
            statusCode: 400,
            error: {
                code: "INVALID_JSON",
                message: "An unexpected error occurred while attempting to parse the JSON.",
                details: parseError
            }
          };
    }
  
    return {
      statusCode: 200,
      body: JSON.stringify(contributions),
    };
};
