// imports
import {stockNewsApiKey} from '../js/config';
import {alphaVantageKey} from '../js/config';
import {rapidApiKey} from '../js/config';

let weightedMentionsArr = [];

let trendingTickersArr = [];
let rankedTickersArr = [];

// top news mention api call
const topNewsData = function() {
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
    });
};

topNewsData();

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
}

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
                console.log(files);
                // loop everything from 2021 into an array
                let currentYearArr = [];
                files.forEach(element => {
                    let currentYear = '2021';
                    if (element.includes(currentYear)) {
                        currentYearArr.push(element);
                        govTransactionsDaily(element);
                    }
                });
                console.log(currentYearArr);
            })
        .catch((response) => {
            console.log(response)
        });
};

const govTransactionsDaily = function(date) {
    fetch('https://senatestockwatcher.com/data/' + date)
        .then(response => {
            if (response.ok) {
                response.json().then(function(data) {
                    console.log(data);
                })
            }
        });
};

govTransactions();