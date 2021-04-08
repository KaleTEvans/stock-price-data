// arrays for sentiment chart
let dailySentimentArr = [];
let dailyQQQArr = [];

let dailyPriceArr = [];
let weightedMentionsArr = [];

let trendingTickersArr = [];
let rankedTickersArr = [];

let yahooData = {};

// arrays for tech chart
let techAnalysisArr = [];
// initial chart selections
let techIndicator = 'SMA';
let interval = 'daily';
let timePeriod = '10';
let seriesType = 'open';

const senatorTransactionsArr = [];

// create the sentiment vs price chart
const topSentimentData = () => {
    fetch('https://stocknewsapi.com/api/v1/stat?&section=alltickers&date=last30days&token=' + stockNewsApiKey)
    .then(response => {
        if(response.ok) {
            response.json().then(function(data) {
                let dailySentiment = data['data'];
                // store the daily open values in an array
                for (var x in dailySentiment) {
                    // get price value
                    let sentimentValue = parseFloat(dailySentiment[x]['sentiment_score']);
                    // new array to store data
                    let sentimentArr = [];
                    sentimentArr.push(new Date(x));
                    sentimentArr.push(sentimentValue);
                    // push to dailypricearr
                    dailySentimentArr.push(sentimentArr);
                }
                // now call the API for QQQ prices
                return fetch("https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=QQQ&apikey=" + alphaVantageKey);
            }).then(response => {
                if (response.ok) {
                    response.json().then(function(data) {
                        let dailyQQQData = data['Time Series (Daily)'];
                        // store the daily open values in an array
                        for (var x in dailyQQQData) {
                            // get price value
                            let openPrice = parseFloat(dailyQQQData[x]['1. open']);
                            // new array to store data
                            let priceArr = [];
                            priceArr.push(new Date(x));
                            priceArr.push(openPrice);
                            // push to dailypricearr
                            dailyQQQArr.push(priceArr);
                        }
                        dailyQQQArr = dailyQQQArr.slice(0, 21);
                        //return dailyQQQArr;
                        sentimentChart(dailySentimentArr, dailyQQQArr)
                    });
                }
            });
        }
    })
    .catch(err => {
        console.log(err);
    });
};

topSentimentData()


// top news mention api call
const topNewsData = () => {
    fetch('https://stocknewsapi.com/api/v1/top-mention?&date=last7days&token=' + stockNewsApiKey)
    .then(response => {
        if (response.ok) {
            response.json().then(function(data) {
                let topMentionsArr = data.data.all

                for (var i=0; i < topMentionsArr.length; i++) {
                    let sentimentScore = topMentionsArr[i].sentiment_score;
                    let mentionedTicker = topMentionsArr[i].ticker;
                    // multiply sentiment score by top ranked stocks in increments of 0.01
                    let weightedScore = (1 - (0.01 * i)) * sentimentScore;
                    
                    weightedMentionsArr.push({
                        ticker: mentionedTicker,
                        score: weightedScore
                    });
                }
                // sort from highest to lowest score
                weightedMentionsArr.sort(function(a, b) {
                    return b.score - a.score;
                });
                stockSuggestions(weightedMentionsArr);
            });
        }
    })
    .catch(err => {
        console.log(err);
    });
};

topNewsData();

// gather data about a specific stock when selected
const yahooStockData = ticker => {
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
                yahooData = {price, summaryProfile, financialData, summaryDetail, defaultKeyStatistics, ...otherData} = data;
                return fetch("https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=" + ticker + "&apikey=" + alphaVantageKey);
            })
            .then(response => {
                if (response.ok) {
                    response.json().then(function(data) {
                        // get yesterdays date
                    let yesterdayDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
                    console.log(yesterdayDate);
                    let weekendDay = moment().format('dddd');
                    console.log(weekendDay);
                    // set date to previous close if on a weekend
                    if (weekendDay === 'Sunday') {
                        yesterdayDate = moment().subtract(2, 'days').format('YYYY-MM-DD');
                    }
                    if (weekendDay === 'Monday') {
                        yesterdayDate = moment().subtract(3, 'days').format('YYYY-MM-DD');
                    }
                    let dailyData = data['Time Series (Daily)'];
                    let previousDayData = dailyData[yesterdayDate];
                    const yesterdayOpen = previousDayData['1. open'];
                    const yesterdayClose = previousDayData['4. close'];
                    const yesterdayVol = previousDayData['5. volume'];
                    const previousDayObj = {yesterdayOpen, yesterdayClose, yesterdayVol};
                    alphaVantageData(dailyData)
                        .then(technicalIndicators(ticker, techIndicator, interval, timePeriod, seriesType))
                        //.then(renderChart(techAnalysisArr, dailyPriceArr))
                        .then(yahooDataElements(yahooData, previousDayObj))
                        .catch(err => {
                            console.log(err)
                        });
                    
                    });
                }
            });
        }
    })
    .catch(err => {
        console.log(err);
    });
}

const alphaVantageData = chartData => {
    // empty previous array
    dailyPriceArr = [];
    // store the daily open values in an array
    for (var x in chartData) {
        // get price value
        let openPrice = parseFloat(chartData[x]['1. open']);
        // new array to store data
        let priceArr = [];
        priceArr.push(new Date(x));
        priceArr.push(openPrice);
        // push to dailypricearr
        dailyPriceArr.push(priceArr);
    }
    return new Promise((resolve) => {       
        resolve(dailyPriceArr);
    })
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
                    // empty the tech analysis array
                    techAnalysisArr = [];
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
                    console.log(techAnalysisArr);
                    renderChart(techAnalysisArr, dailyPriceArr)
                    return new Promise((resolve) => {       
                        resolve(techAnalysisArr);
                    })
                });
            }
        })
        .catch(err => {
            console.log(err);
        });
};


// trending tickers list 
const trendingTickers = function() {
    fetch("https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/get-trending-tickers?region=US", {
        "method": "GET",
        "headers": {
            "x-rapidapi-key": rapidApiKey,
            "x-rapidapi-host": "apidojo-yahoo-finance-v1.p.rapidapi.com"
        }
    })
    .then(response => {
        if (response.ok) {
            response.json().then(function(data) {
                let trendingTickersData = data.finance.result[0].quotes;
                // loop through array to get stock tickers
                for (let i=0; i < trendingTickersData.length; i++) {
                    if (trendingTickersData[i].quoteType === 'EQUITY') {
                        trendingTickersArr.push(trendingTickersData[i].symbol);
                    }
                }
                // now loop through function to get sentiment for each ticker
                singleStockLooper(trendingTickersArr);
                
            });
        }
    })
    .catch(err => {
        console.error(err);
    });
};

// function to take array outputs and imput them into the single stock function
const singleStockLooper = function(array) {
    for (let i=0; i < array.length; i++) {
        singleSentimentStocks(array[i]);
    } 
    console.log(rankedTickersArr);
}

const singleSentimentStocks = function(ticker) {
    fetch('https://stocknewsapi.com/api/v1/stat?&tickers=' + ticker + '&date=last7days&token=' + stockNewsApiKey)
    .then (response => {
        if (response.ok) {
            response.json().then(function(data) {
                console.log(data);
                // break function if ticker isnt read
                if (data.data.length === 0) {
                    return;
                }
                let sentimentScore = data.total[ticker]['Sentiment Score'];
                
                // push to array
                rankedTickersArr.push({
                    ticker: ticker,
                    sentiment: sentimentScore
                });
            });
        }
    })    
};

// news articles for a single ticker

const singleTickerNews = function() {
    fetch('https://stocknewsapi.com/api/v1?tickers=' + ticker + '&items=50&extra-fields=rankscore&token=' + stockNewsApiKey)
    .then(response => {
        if (response.ok) {
            response.json().then(function(data) {
                console.log(data);
            })
        }
    });
}
//singleTickerNews();

//trendingTickers();

const govTransactions = function() {
    fetch('https://senate-stock-watcher-data.s3-us-west-2.amazonaws.com/')
        .then((response) => response.text())
            .then((response) => {
                const parser = new DOMParser()
                const xml = parser.parseFromString(response, 'text/xml')
                const results = [].slice.call( xml.getElementsByTagName('Key') ).filter((key) => key.textContent.includes('.json'))
                const files = results.map(file => file.textContent.split('/')[1])
                let dateArr = [];
                // loop everything from 2021 into an array
                files.forEach(element => {
                    let currentYear = '2021';
                    if (element.includes(currentYear)) {
                        //govTransactionsDaily(element);
                        dateArr.push(element);
                    }
                });
                govTransactionsDaily(dateArr);
                
            })
        .catch((response) => {
            console.log(response)
        });
};

const govTransactionsDaily = function(date) {
    for (let i=0; i < date.length; i++) {
        fetch('https://senatestockwatcher.com/data/' + date[i])
            .then(response => {
                if (response.ok) {
                    response.json().then(function(data) {   
                        senatorTransactionsArr.push(data);
                        /*for (let i = 0; i < data.length; i++) {
                                
                            let fullName = data[i].office;
                            let transactions = data[i].transactions;
                            let tempArr = [];
                            tempArr.push(fullName);
                            tempArr.push(transactions);

                            senatorTransactionsArr.push(tempArr);
                        }*/
                    });
                }
            })
        .catch((response) => {
            console.log(response)
        });
    }
    Promise.all(senatorTransactionsArr).then((values =>
        console.log(values)
    ));
};

const transactionRunner = function(array) {
    console.log(array);
    for (let i=0; i < array.length; i++) {
        console.log(senatorTransactionsArr[i]);
        
    }
}

//govTransactions();