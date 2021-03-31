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
                Data from a week ago
                Data from a month ago
                Compare performance to sector performance
                Create technical indicator charts
                */

var stockTicker;

let priceData = [];
let volumeData = [];
let otherData = [];
let previousDayData = [];

let dailyPriceArr = [];

// initial chart selections
let techIndicator = 'SMA';
let interval = 'daily';
let timePeriod = '10';
let seriesType = 'open';

let tickerFormEl = document.querySelector('#stock-ticker');
let tickerInput = document.querySelector('#ticker');

let priceDataEl = document.querySelector('#price-data');
let volumeDataEl = document.querySelector('#volume-data');
let otherDataEl = document.querySelector('#other-data');
let pastDataEl = document.querySelector('#past-data');

let cardHeaderEl = document.querySelector('.card-header');
const chartGenerateButtonEl = document.getElementById('tech-charts');


let submitButtonHandler = function(event) {
    event.preventDefault();

    stockTicker = tickerInput.value.trim();

    if (stockTicker) {
        yahooSummaryData(stockTicker);
    }
    
}


let yahooSummaryData = function(ticker) {
    fetch("https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-summary?symbol=" + ticker + "&region=US", {
        "method": "GET",
        "headers": {
            "x-rapidapi-key": rapidApiKey,
            "x-rapidapi-host": "apidojo-yahoo-finance-v1.p.rapidapi.com"
        }
    })
    .then(response => {
        if (response.ok) {
            response.json().then(function(data) {
                // reset html
                tickerInput.textContent = "";
                priceDataEl.textContent = "";
                volumeDataEl.textContent = "";
                otherDataEl.textContent = "";

                let stockName = data.price.shortName;
                $('#stock-name').html(stockName);
                let sectorName = data.summaryProfile.sector;
                $('#sector').html('Sector: ' + sectorName);
                // create pricing elements
                priceData.push({
                    currentAsk: data.financialData.currentPrice.raw,
                    marketOpen: data.summaryDetail.regularMarketOpen.raw,
                    marketPercentChange: data.price.regularMarketChangePercent.fmt,
                    fiftyDayAvg: data.summaryDetail.fiftyDayAverage.raw,
                    twoHdDayAvg: data.summaryDetail.twoHundredDayAverage.raw,
                    yearHigh: data.summaryDetail.fiftyTwoWeekHigh.raw,
                    yearLow: data.summaryDetail.fiftyTwoWeekLow.raw
                });
                // price header
                let priceHeaderEl = document.createElement('h5');
                priceHeaderEl.textContent = 'Price Info';
                priceDataEl.appendChild(priceHeaderEl);
                // current ask
                let currentAskEl = document.createElement('li');
                currentAskEl.textContent = 'Current Ask: ' + priceData[0].currentAsk;
                priceDataEl.appendChild(currentAskEl);
                // market open price
                let marketOpenEl = document.createElement('li');
                marketOpenEl.textContent = 'Price at Open: ' + priceData[0].marketOpen;
                priceDataEl.appendChild(marketOpenEl);
                // market change percent
                let marketChangePercentEl = document.createElement('li');
                marketChangePercentEl.textContent = 'Percent Change Since Open: ' + priceData[0].marketPercentChange;
                priceDataEl.appendChild(marketChangePercentEl);
                // 50 day avg
                let fiftyDayEl = document.createElement('li');
                fiftyDayEl.textContent = 'Fifty Day Average: ' + priceData[0].fiftyDayAvg;
                priceDataEl.appendChild(fiftyDayEl);
                // 200 day avg
                let twoHdEl = document.createElement('li');
                twoHdEl.textContent = 'Two Hundred Day Average: ' + priceData[0].twoHdDayAvg;
                priceDataEl.appendChild(twoHdEl);
                // 52 wk high
                let yearHighEl = document.createElement('li');
                yearHighEl.textContent = '52 Week High: ' + priceData[0].yearHigh;
                priceDataEl.appendChild(yearHighEl);
                // 52 wk low
                let yearLowEl = document.createElement('li');
                yearLowEl.textContent = '52 Week Low: ' + priceData[0].yearLow;
                priceDataEl.appendChild(yearLowEl);

                // extract volume data
                volumeData.push({
                    currentVol: data.summaryDetail.volume.raw,
                    averageVol: data.summaryDetail.averageVolume.raw,
                    tenDayVol: data.summaryDetail.averageDailyVolume10Day.raw,
                    threeMonthVol: data.price.averageDailyVolume3Month.raw
                });
                // volume header
                let volumeHeaderEl = document.createElement('h5');
                volumeHeaderEl.textContent = 'Volume Info';
                volumeDataEl.appendChild(volumeHeaderEl);
                // current volume
                let currentVolEl = document.createElement('li');
                currentVolEl.textContent = 'Current Volume: ' + volumeData[0].currentVol
                volumeDataEl.appendChild(currentVolEl);
                // average volume
                let avgVolume = document.createElement('li');
                avgVolume.textContent = "Average Volume: " + volumeData[0].averageVol;
                volumeDataEl.appendChild(avgVolume);
                // 10 day volume
                let tenDayVolEl = document.createElement('li');
                tenDayVolEl.textContent = 'Ten Day Average Volume: ' + volumeData[0].tenDayVol;
                volumeDataEl.appendChild(tenDayVolEl);
                // 3 month vol
                let threeMonthVolEl = document.createElement('li');
                threeMonthVolEl.textContent = 'Three Month Average Volume: ' + volumeData[0].threeMonthVol;
                volumeDataEl.appendChild(threeMonthVolEl);

                // extract other data
                otherData.push({
                    percentInsiders: data.defaultKeyStatistics.heldPercentInsiders.raw,
                    percentInstitutions: data.defaultKeyStatistics.heldPercentInstitutions.raw,
                    meanTargetPrice: data.financialData.targetMeanPrice.raw,
                    shortPercentFloat: data.defaultKeyStatistics.shortPercentOfFloat.fmt,
                    shortFloat: data.defaultKeyStatistics.sharesShort.raw,
                    shortPreviousMonth: data.defaultKeyStatistics.sharesShortPriorMonth.raw,
                    totalFloat: data.defaultKeyStatistics.floatShares.raw
                });
                // other data header
                let otherHeaderEl = document.createElement('h5');
                otherHeaderEl.textContent = 'Other Info';
                otherDataEl.appendChild(otherHeaderEl);
                // percent insiders
                let percentInsidersEl = document.createElement('li');
                percentInsidersEl.textContent = 'Percent Float Held by Insiders: ' + (otherData[0].percentInsiders * 100);
                otherDataEl.appendChild(percentInsidersEl);
                // percent institutions
                let percentInstitutionsEl = document.createElement('li');
                percentInstitutionsEl.textContent = "Percent Float Held by Instititions: " + (otherData[0].percentInstitutions * 100);
                otherDataEl.appendChild(percentInstitutionsEl);
                // mean target price
                let meanTargetEl = document.createElement('li');
                meanTargetEl.textContent = 'Average Price Target: ' + otherData[0].meanTargetPrice;
                otherDataEl.appendChild(meanTargetEl);
                // short percent float
                let shortFloatEl = document.createElement('li');
                shortFloatEl.textContent = 'Percent of Float Shares Short: ' + otherData[0].shortPercentFloat;
                otherDataEl.appendChild(shortFloatEl);
                // short float amount
                let shortFloatAmt = document.createElement('li');
                shortFloatAmt.textContent = "Total Shares Short: " + otherData[0].shortFloat;
                otherDataEl.appendChild(shortFloatAmt);
                // short previous month
                let shortPrevMonthEl = document.createElement('li');
                shortPrevMonthEl.textContent = 'Total Shares Short Previous Month: ' + otherData[0].shortPreviousMonth;
                otherDataEl.appendChild(shortPrevMonthEl);
                // total float
                let totalFloatEl = document.createElement('li');
                totalFloatEl.textContent = 'Total Float Shares: ' + otherData[0].totalFloat;
                otherDataEl.appendChild(totalFloatEl);
            });
            // run alpha function
            alphaVantageData(ticker);
        }
    })
    .catch(err => {
        console.error(err);
    });

};

// alpha api key: XOL29ZT3Y55LY04P

let alphaVantageData = function(ticker) {
    fetch("https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + ticker + "&apikey=" + alphaVantageKey)
    .then(response => {
        if (response.ok) {
            // get yesterdays date
            let yesterdayDate = moment().subtract(1, 'days').format('YYYY-MM-DD');

            response.json().then(function(data) {
                // past data header
                let pastHeaderEl = document.createElement('h5');
                pastHeaderEl.textContent = 'Past Data';
                pastDataEl.appendChild(pastHeaderEl);
                let dailyData = data['Time Series (Daily)'];
                let previousDayEl = dailyData[yesterdayDate];
                // push to array
                previousDayData.push({
                    yesterdayOpen: previousDayEl['1. open'],
                    yesterdayClose: previousDayEl['4. close'],
                    yesterdayVol: previousDayEl['5. volume']
                });
                // append items to list
                let yesterdayVolEl = document.createElement('li');
                yesterdayVolEl.textContent = "Yesterday's volume: " + previousDayData[0].yesterdayVol;
                pastDataEl.appendChild(yesterdayVolEl);

                let yesterdayOpenEl = document.createElement('li');
                yesterdayOpenEl.textContent = "Yesterday's Opening Price: " + previousDayData[0].yesterdayOpen;
                pastDataEl.appendChild(yesterdayOpenEl);

                let yesterdayCloseEl = document.createElement('li');
                yesterdayCloseEl.textContent = "Yesterday's Closing Price: " + previousDayData[0].yesterdayClose;
                pastDataEl.appendChild(yesterdayCloseEl);

                // store the daily open values in an array
                for (var x in dailyData) {
                    // get price value
                    let openPrice = parseFloat(dailyData[x]['1. open']);
                    // new array to store data
                    let priceArr = [];
                    priceArr.push(new Date(x));
                    priceArr.push(openPrice);
                    // push to dailypricearr
                    dailyPriceArr.push(priceArr);
                }

            });
            // run the techindicator function
            technicalIndicators(ticker, techIndicator, interval, timePeriod, seriesType);
        }
    })
    .catch(err => {
        console.error(err);
    });

};

const technicalChartsButtonHandler = function(event) {
    event.preventDefault();

    $('#chartDiv').html('');

    let indicatorSelection = document.getElementById('tech-indicator').value;
    let intervalSelection = document.getElementById('time-interval').value;

    technicalIndicators(stockTicker, indicatorSelection, intervalSelection, timePeriod, seriesType);
};

// gather data for the chart 
const technicalIndicators = function(ticker, techIndicator, interval, timePeriod, seriesType) {
    
    fetch("https://www.alphavantage.co/query?function=" + techIndicator + "&symbol=" + ticker + 
        "&interval=" + interval + "&time_period=" + timePeriod + "&series_type=" + seriesType + "&apikey=" + alphaVantageKey)
        .then(response => {
            if (response.ok) {
                response.json().then(function(data) {
                    $("#tech-chart-title").html(data['Meta Data']['2: Indicator']);
                    let techAnalysis = data['Technical Analysis: ' + techIndicator];
                    //console.log(techAnalysis);

                    // put the items in an array
                    let techAnalysisArr = [];
                    // loop over the object to put items in the array
                    for (var x in techAnalysis) {
                        // get price value
                        let dataValue = parseFloat(techAnalysis[x][techIndicator]);
                        // new array to store each date and price value
                        let newArr = [];
                        newArr.push(new Date(x));
                        newArr.push(dataValue);
                        //push to main array
                        techAnalysisArr.push(newArr);
                    }
                    techAnalysisArr = techAnalysisArr.slice(0, 100);
                    renderChart(techAnalysisArr, dailyPriceArr);
                    //console.log(techAnalysisArr);
                });
            }
        });
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
}

//renderChart();

//quoteData();
tickerFormEl.addEventListener('submit', submitButtonHandler);
chartGenerateButtonEl.addEventListener('click', technicalChartsButtonHandler);
