/* **************** Stock Data Collector **************

Purpose is to predict stock movement based on several factors
1. Collect top mentioned stocks and their sentiment and then rank them
2. Input the tickers into the yahoo api to collect all stock data
3. Determine pricing, volume, and other data for each stock
    3a. Compare current volume to average volume (if high, give ranking points)
    3b. Compare current price to average price (if around average, or lower than average, give ranking points)
    3c. Compare current price to mean target price (print this to page, no points)
    3d. Compare percent insiders and institutions holding (will need to determine what is high and whats not)
    3e. Determine whether short percent float is high or not
4. Gather past data to determine if a big move is possible
5. Compare all this data to produce the most likely mover
6. Collect price data for each top ranked mover over a period of time to determine prediction outcome

*/

 /*
                ************** NEXT ADDITIONS *****************
                Volume at current time yesterday
                Stock Price vs Sentiment Chart
                Add stock price to top sentiment list

                Compare performance to sector performance
                
                */


let stockTicker;

const topSentimentEl = document.querySelector('.top-suggestions');

let tickerFormEl = document.querySelector('#stock-ticker');
let tickerInput = document.querySelector('#ticker');

const yahooDataEl = document.querySelector('#yahoo-data');

let cardHeaderEl = document.querySelector('.card-header');
const chartGenerateButtonEl = document.getElementById('tech-charts');

// gather the overall market sentiment for the day
const generalMarketSentiment = () => {
    fetch('https://stocknewsapi.com/api/v1/category?section=general&items=50&token=' + stockNewsApiKey)
    .then(response => {
        if (response.ok) {
            response.json().then(function(data) {
                // create sentiment variables
                let sentimentPositive = 0;
                let sentimentNegative = 0;
                let sentimentNeutral = 0;
                // loop over the articles to retrieve sentiment
                for (let i=0; i < data.data.length; i++) {
                    let generalSentiment = data.data[i].sentiment;
                    // Add 1 for each sentiment type
                    if (generalSentiment === 'Positive') {
                        sentimentPositive++;
                    }
                    if (generalSentiment === 'Negative') {
                        sentimentNegative++;
                    }
                    if (generalSentiment === 'Neutral') {
                        sentimentNeutral++;
                    }
                }
                // now create the html element
                let genSentimentValue = document.getElementById('gen-sent-value');
                if (sentimentNeutral > sentimentPositive + sentimentNegative) {
                    genSentimentValue.textContent = 'Neutral';
                    genSentimentValue.classList = 'neutral';
                } 
                if (sentimentPositive > sentimentNegative && sentimentPositive <= sentimentNeutral) {
                    genSentimentValue.textContent = 'Slightly Positive';
                    genSentimentValue.classList = 'slightly-positive';
                }
                if (sentimentPositive > sentimentNegative && sentimentPositive > sentimentNeutral) {
                    genSentimentValue.textContent = 'Positive';
                    genSentimentValue.classList = 'positive';
                }
                if (sentimentNegative > sentimentPositive && sentimentNegative <= sentimentNeutral) {
                    genSentimentValue.textContent = 'Slightly Negative';
                    genSentimentValue.classList = 'slightly-negative';
                }
                if (sentimentNegative > sentimentPositive && sentimentNegative > sentimentNeutral) {
                    genSentimentValue.textContent = 'Negative';
                    genSentimentValue.classList = 'negative';
                }
            });
        }
    })
    .catch(err => {
        console.log(err);
    });
};

// function to create the chart
function sentimentChart(sentiment, qqqPrice) {
    JSC.Chart('sentimentChartDiv', {
        debug: true,
        type: 'line',
        legend: {
            template: '%icon %name',
            position: 'inside top left'
        },
        defaultPoint_marker_type: 'none',
        xAxis_crosshair_enabled: true,
        yAxis: [
            {
                id: 'leftAxis',
                label_text: 'Sentiment Score',
            }, {
                id: 'rightAxis',
                label_text: 'Price Range',
                formatString: 'c0',
                orientation: 'right'
            }
        ],
        series: [
            {
                name: 'Sentiment Score',
                yAxis: 'leftAxis',
                points: sentiment
            }, {
                name: 'QQQ Movement',
                yAxis: 'rightAxis',
                points: qqqPrice
            }
        ]
    });
};

// function to populate top sentiment cards
const stockSuggestions = topMentions => {
    for (let i=0; i <= 21; i++) {
        // create cards for each item
        let suggestionCard = document.createElement('li');
        suggestionCard.classList = 'card top-suggested';
        suggestionCard.setAttribute('id', topMentions[i].ticker);
        suggestionCard.innerHTML = '<h6 class="ticker-header id="ticker-"' + i + ">" + topMentions[i].ticker + 
            "</h6>" + '<p class="card-info" id="suggestion-"' + i + '>Score: ' +  topMentions[i].score.toFixed(2) + '</p>';
        
        topSentimentEl.appendChild(suggestionCard);
    }
};

$('.top-suggestions').on('click', '.card', function() {
    // clear stock ticker value
    stockTicker = '';

    let stockEl = $(this).attr('id');
    stockTicker = stockEl;
    console.log(stockTicker);
    // pass the stock ticker to the summary function
    yahooStockData(stockTicker);
});

const submitButtonHandler = function(event) {
    event.preventDefault();
    // clear stockTicker value
    stockTicker = '';

    stockTicker = tickerInput.value.trim();

    if (stockTicker) {
        yahooStockData(stockTicker);
    }
};

const yahooDataElements = (yahooData, alphaData) => {
    // clear previous content
    yahooDataEl.innerHTML = '';
    // fill with new content
    yahooDataEl.innerHTML = `
                <h4 class="card-header" >Stock Name: ${yahooData.price.shortName}</h4>
                <p class='sector'>Sector: ${yahooData.summaryProfile.sector}</p>
                <ul class= price-data id="price-data">
                    <h5>Price Info</h5>
                    <li>Current Ask: $${yahooData.financialData.currentPrice.raw}</li>
                    <li>Price at Open: $${yahooData.summaryDetail.regularMarketOpen.raw}</li>
                    <li>Percent Change Since Open: ${yahooData.price.regularMarketChangePercent.fmt}</li>
                    <li>Previous Day Open: $${alphaData.yesterdayOpen}</li>
                    <li>Previous Day Close: $${alphaData.yesterdayClose}</li>
                    <li>50 Day Average: $${yahooData.summaryDetail.fiftyDayAverage.raw}</li>
                    <li>200 Day Average: $${yahooData.summaryDetail.twoHundredDayAverage.raw}</li>
                    <li>Year High: $${yahooData.summaryDetail.fiftyTwoWeekHigh.raw}</li>
                    <li>Year Low: $${yahooData.summaryDetail.fiftyTwoWeekLow.raw}</li>
                </ul>
                <ul class="volume-data" id="volume-data">
                    <h5>Volume Info</h5>
                    <li>Current Volume: ${yahooData.summaryDetail.volume.raw}</li>
                    <li>Average Volume: ${yahooData.summaryDetail.averageVolume.raw}</li>
                    <li>10 Day Volume: ${yahooData.summaryDetail.averageDailyVolume10Day.raw}</li>
                    <li>Three Month Volume: ${yahooData.price.averageDailyVolume3Month.raw}</li>
                    <li>Previous Day Volume: ${alphaData.yesterdayVol}</li>
                </ul>
                <ul class="other-data" id="other-data">
                    <h5>Other Data</h5>
                    <li>Held by Insiders (% of Float): ${(yahooData.defaultKeyStatistics.heldPercentInsiders.raw * 100).toFixed(2)}%</li>
                    <li>Held by Institutions (% of Float): ${(yahooData.defaultKeyStatistics.heldPercentInstitutions.raw * 100).toFixed(2)}%</li>
                    <li>Average Price Target: $${yahooData.financialData.targetMeanPrice.raw}</li>
                    <li>Shares Short (% of Float): ${yahooData.defaultKeyStatistics.shortPercentOfFloat.fmt}</li>
                    <li>Short Float: ${yahooData.defaultKeyStatistics.sharesShort.raw}</li>
                    <li>Short Float Previus Month: ${yahooData.defaultKeyStatistics.sharesShortPriorMonth.raw}</li>
                    <li>Total Float: ${yahooData.defaultKeyStatistics.floatShares.raw}</li>
                </ul>
        `;
    return new Promise((resolve) => {
        resolve();
    });
}

const technicalChartsButtonHandler = function(event) {
    event.preventDefault();

    $('#chartDiv').html('');

    let indicatorSelection = document.getElementById('tech-indicator').value;
    let intervalSelection = document.getElementById('time-interval').value;
    console.log(stockTicker, indicatorSelection, intervalSelection, timePeriod, seriesType);
    technicalIndicators(stockTicker, indicatorSelection, intervalSelection, timePeriod, seriesType);
};

// function to create the chart
function renderChart(data1, data2) {
    JSC.Chart('chartDiv', {
        debug: true,
        type: 'line',
        legend: {
            template: '%icon %name',
            position: 'inside top left'
        },
        defaultPoint_marker_type: 'none',
        xAxis_crosshair_enabled: true,
        yAxis_formatString: 'c',
        series: [
            {
                name: 'Technical Indicator',
                points: data1
            }, {
                name: 'Price at Open',
                points: data2
            }
        ]
    });
    return new Promise((resolve) => {
        resolve();
    });
}

generalMarketSentiment();

tickerFormEl.addEventListener('submit', submitButtonHandler);
chartGenerateButtonEl.addEventListener('click', technicalChartsButtonHandler);
