let tickerFormEl = document.querySelector('#stock-ticker');
let tickerInput = document.querySelector('#ticker');

let submitButtonHandler = function(event) {
    event.preventDefault();

    let stockTicker = tickerInput.value.trim();

    if (stockTicker) {

        quoteData(stockTicker);
    }
    
}


let quoteData = function(ticker) {
    fetch("https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/v2/get-quotes?region=US&symbols=" + ticker, {
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
                let stockAsk = data.quoteResponse.result[0].ask
                $('#current-ask').html(stockAsk);
            })
        }
    })
    .catch(err => {
        console.error(err);
    });

}

//quoteData();
tickerFormEl.addEventListener('submit', submitButtonHandler);