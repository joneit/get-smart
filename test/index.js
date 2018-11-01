getSmart('module', cb, { log: log.bind(null, 2) });

(new getSmart).fetch('module', cb, { log: log.bind(null, 3) });

function cb(f){
    f(99);
}

function log(column, s) {
    document.querySelector('td:nth-child(' + column + ')').innerHTML += s + '<br>';
}
