const fs = require('fs').promises;
const path = require('path');

export default async (req) => {
    let query = `
        query($userName: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $userName) {
                contributionsCollection(from: $from, to: $to) {
                    contributionCalendar {
                        totalContributions
                        weeks {
                            contributionDays {
                                contributionCount
                                date
                            }
                        }
                    }
                }
            }
        }
    `
    const thisYear = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"})).getFullYear();
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"})).toISOString();
    const fromYear = `${thisYear}`;

    let variables = {
        userName: "elliottprogrammer",
        from: `${fromYear}-01-01T00:00:00Z`,
        to: `${now}`,
    }

    try {
        const response = await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.GITHUB_PAT}`,
                "User-Agent": "elliottprogrammer"
            },
            body: JSON.stringify({
                query: query,
                variables: variables,
            }),
        });

        const data = await response.json();
        const writablePath = path.join('/tmp', `contributions-${thisYear}.json`);
        const gitContributionDirectory = 'git-contribution-data';
        await fs.writeFile(writablePath, JSON.stringify(data, null, 2));

        console.log(`JSON data saved to contributions-${thisYear}.json`);

    } catch (err) {
        console.log(`There was an error fetching or writing file: contributions-${thisYear}.json`, err);
    }
}
