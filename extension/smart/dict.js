function Trie() {
    this.data = "";
    this.isWord = false;
    this.children = {};
}

function buildDictionary(wordList) {
    var d = new Trie();
    for(w in wordList) {
        addWord(wordList[w], d);
    }
    
    return d;
}

function addWord(word, trie) {
    if(word.length == 0) {
        trie.isWord = true;
        return trie;
    }
    
    var letterToAdd = word[0];
    if(!(letterToAdd in trie.children)) {
        trie.children[letterToAdd] = new Trie();
        trie.children[letterToAdd].data = trie.data + letterToAdd;
    }
    return addWord(word.substr(1), trie.children[letterToAdd]);
}

function getWord(word, trie) {
    return getWordHelper(word, word, trie);
}

function getWordHelper(origWord, word, trie) {
    var letterToCheck = word[0];
    if(letterToCheck in trie.children) {
        return getWordHelper(origWord, word.substr(1), trie.children[letterToCheck]);
    }
    return trie;
}

function hasWord(word, trie) {
    var res = getWord(word, trie);
    return res.data == word && res.isWord;
}

/***** IMPORTANT *****/
// if abbreviation is specified, then any string in the trie
// that is of sufficient length will be counted as a word
function findAllWords(str, trie, abbr) {
    var words = new Set();
    
    if(typeof abbr == "undefined")
        abbr = str.length;
    
    for(var s = 0; s < str.length; s++)
    {
        var total = "";
        var currWord = str.substr(s);
        
        var currTrie = trie;
        for(var i = 0; i < currWord.length; i++) {
            currTrie = getWord(currWord[i], currTrie);
            if(currTrie.data.length <= i) { // almost certainly should be <=, not <, changed 7/19/2016
                break;
            }
            
            if(currTrie.isWord || currTrie.data.length >= abbr) {
                words.add(currTrie.data);
            }
        }
    }
    
    var arrWords = [...words];
    
    arrWords.sort(function(a, b) {
       return b.length - a.length; 
    });
    
    return arrWords;
}

function getUniqueWords(wordList, trie) {
    var words = [];
    
    for(var i = 0; i < wordList.length; i++) {
        if(hasWord(wordList[i], trie)) {
            // do we have something containing this word already?
            for(var j = 0; j < words.length; j++) {
                var alreadyPresent = false;
                if(words[j].indexOf(wordList[i]) >= 0) {
                    alreadyPresent = true;
                    break;
                }
            }
            if(!alreadyPresent) {
                words.push(wordList[i]);
            }
        }
    }
    
    return words;
}