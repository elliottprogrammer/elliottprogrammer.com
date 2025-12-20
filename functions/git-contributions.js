const { getStore } = require('@netlify/blobs');

exports.handler = async (event, context) => {
    const storeName = 'git-contribution-data';
    let contributions = [];

    try {
        const store = getStore({ name: storeName });
        let cursor;
        const blobKeys = [];

        do {
            const { blobs = [], cursor: nextCursor } = await store.list({ cursor });
            blobs.forEach(({ key }) => blobKeys.push(key));
            cursor = nextCursor;
        } while (cursor);

        const blobProcessingPromises = blobKeys.map(async (key) => {
            const yearMatch = key.match(/^([\\d]{4})$/);
            const year = yearMatch && yearMatch[1];

            if (!year) {
                throw new Error('Unexpected blob key.');
            }

            try {
                const jsonObject = await store.getJSON(key);
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
                            code: "BLOB_READ_ERROR",
                            message: `Error reading blob ${key}.`,
                            details: readError
                        },
                    }),
                };
            }
        });

        await Promise.all(blobProcessingPromises); // Wait for all blob processing to complete

        return {
            statusCode: 200,
            body: JSON.stringify(contributions),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: {
                    code: "BLOB_STORE_READ_ERROR",
                    message: `Error reading blob store ${storeName}.`,
                    details: error
                },
            }),
        };
    }
};
