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

let priceData = [];
let volumeData = [];
let otherData = [];

let tickerFormEl = document.querySelector('#stock-ticker');
let tickerInput = document.querySelector('#ticker');

let priceDataEl = document.querySelector('#price-data');
let volumeDataEl = document.querySelector('#volume-data');
let otherDataEl = document.querySelector('#other-data');

let submitButtonHandler = function(event) {
    event.preventDefault();

    let stockTicker = tickerInput.value.trim();

    if (stockTicker) {

        quoteData(stockTicker);
    }
    
}


let quoteData = function(ticker) {
    fetch("https://apidojo-yahoo-finance-v1.p.rapidapi.com/stock/v2/get-summary?symbol=" + ticker + "&region=US", {
        "method": "GET",
        "headers": {
            "x-rapidapi-key": "0b97a795ecmsh27eb9b574dcfb7cp13cbdajsn4983672dc0aa",
            "x-rapidapi-host": "apidojo-yahoo-finance-v1.p.rapidapi.com"
        }
    })
    .then(response => {
        console.log(response);
        if (response.ok) {
            response.json().then(function(data) {
                let stockName = data.price.shortName;
                $('#stock-name').html(stockName);
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
            })
        }
    })
    .catch(err => {
        console.error(err);
    });

}

//quoteData();
tickerFormEl.addEventListener('submit', submitButtonHandler);