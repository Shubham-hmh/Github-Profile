const bodyParser = require("body-parser");
const express= require("express");
const github=require('github-profile');
const dotenv=require('dotenv');
const app =express();
const axios = require('axios');
dotenv.config();

const TOKEN=process.env.GITHUB_TOKEN;
const Port =process.env.PORT || 5000;
const query = `
  query($userName: String!) {
    user(login: $userName) {
      contributionsCollection {
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
`;

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json())

app.set('view engine','ejs');
app.get('/',(req,res)=>{
    res.render('index',{profile:""})

})

// Route to render contribution graph
app.post('/contribution-graph', async (req, res) => {
  //const userName = 'yuichkun'; // Replace with the desired GitHub username
  const {userName} =req.body;

  try {
    const result = await retrieveContributionData(userName);
    const contributions = result.data.user.contributionsCollection.contributionCalendar.weeks;

    const dates = [];
    const counts = [];

    contributions.forEach((week) => {
      week.contributionDays.forEach((day) => {
        dates.push(day.date);
        counts.push(day.contributionCount);
      });
    });

    // Rendering the graph
   res.send(renderContributionGraph(dates, counts));



  } catch (error) {
    res.status(500).send('Failed to retrieve contribution data');
  }
});

// Function to render the contribution graph using Chart.js
function renderContributionGraph(dates, counts) {
  return `
    <html>
      <head>
        <title>Contribution Graph</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      </head>
      <body>
        <canvas id="contributionChart" width="800" height="400"></canvas>
        <script>
          var ctx = document.getElementById('contributionChart').getContext('2d');
          var myChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: ${JSON.stringify(dates)},
              datasets: [{
                label: 'Contributions per day',
                data: ${JSON.stringify(counts)},
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
              }]
            },
            options: {
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        </script>
      </body>
    </html>
  `;
}

async function retrieveContributionData(userName) {
  const variables = {
    userName: userName
  };

  const body = {
    query: query,
    variables: variables
  };

  try {
    const response = await axios.post('https://api.github.com/graphql', body, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      }
    });

    return response.data;
  } catch (error) {
    throw new Error(`Failed to retrieve contribution data: ${error}`);
  }
}

app.post('/getinfo',(req,res)=>{
    github(req.body.email).then((profile)=>{
        console.log(profile);
        res.render('index',{profile:profile})
    })
})


app.listen(Port,()=>{
      console.log("server is listening on port :5000");
})