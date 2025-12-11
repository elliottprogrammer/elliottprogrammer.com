const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
    const directoryPath = 'git-contribution-data';
    let contributions = [];

    try {
        const files = await fs.readdir(directoryPath); // Read directory contents
    
        const fileProcessingPromises = files.map(async (filename) => {
            const filePath = path.join(directoryPath, filename);
            const yearMatch = filename.match(/contributions-([\d]+)\.json$/);
            const year = yearMatch && yearMatch.length && yearMatch[1];
            const stats = await fs.stat(filePath); // Get file stats to check if it's a file
        
            if (! stats.isFile() || ! year) {
                throw new Error('Unexpected filename or directory.');
            }
            try {
                const data = await fs.readFile(filePath, 'utf8'); // Read file content
                // 'data' contains the file contents (JSON data).
                const jsonObject = JSON.parse(data);
                const totalContributions =  jsonObject?.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions;
                const weeks = jsonObject?.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
                const contributionObject = {
                    year: year,
                    total_contributions: totalContributions,
                    weeks: weeks,
                }
                contributions.push(contributionObject);
            } catch (readError) {
                return {
                    statusCode: 500,
                    body: JSON.stringify({
                        error: {
                            code: "FILE_READ_ERROR",
                            message: `Error reading file ${filename}.`,
                            details: readError
                        },
                    }),
                };
            }
        });
    
        await Promise.all(fileProcessingPromises); // Wait for all file processing to complete
    
        // All files processed at this point.
        const response = {
            statusCode: 200,
            body: JSON.stringify(contributions),
        };

        return response;
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: {
                    code: "FILE_OR_DIRECTORY_READ_ERROR",
                    message: `Error reading directory path ${directoryPath}.`,
                    details: error
                },
            }),
        };
    }
};

