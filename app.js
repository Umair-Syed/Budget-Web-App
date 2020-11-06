//Data Module
var budgetController = (function() {

    //constructors
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    }; 

    Expense.prototype.calcPercentage = function(totalIncome) {
        if(totalIncome > 0) {
            this.percentage = Math.round((this.value/totalIncome) * 100);
        }else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function() {
        return this.percentage;
    };

    // can calcutate total income or total expenses
    var calculateTotal = function(type) {
        var sum = 0;
        data.allItems[type].forEach(function(curr){
            sum +=  curr.value;
        });

        data.totals[type] = sum;  
    };

    //Data Structure
    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    };

    return {        
        addItem: function(type, des, val) {
            var newItem, ID;
            
            // Create new ID
            if(data.allItems[type].length > 0){
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1; //id of new item is id of last Item + 1
            }else {
                ID = 0;
            }
            
            // Create new item based on 'inc' or 'exp' type
            if(type === 'exp') {
                newItem = new Expense(ID, des, val);
            }else if(type === 'inc') {
                newItem = new Income(ID, des, val);
            }

            data.allItems[type].push(newItem);
            return newItem;
        },

        deleteItem: function(type, id) {  
            // id is not index, so need to get index from id
            var ids, index;
            ids = data.allItems[type].map(function(current) { // ids will be array of ids
                return current.id;
            });

            index = ids.indexOf(id);  // -1 if id does not exist in ids
            
            if(index !== -1) {
                data.allItems[type].splice(index, 1); //splice will remove 1 item at index 
            }                        

        },

        calculateBudget: function() {

            // Calculate total income and expenses
            calculateTotal('exp');
            calculateTotal('inc');

            // Calculate the budget: income - expenses
            data.budget = data.totals.inc - data.totals.exp;

            // Calculate the percentage of income that we spent 
            if(data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            }else {
                data.percentage = -1;
            }
            
        },

        // Calculate percentages for each expense in the list, using calcPercentage prototype 
        calculatePercentages: function() {
            data.allItems.exp.forEach(function(current) {
                current.calcPercentage(data.totals.inc);
            });
        },

        // Get percentages of all the expenses from the expenses list, using getPercentage prototype
        getPercentages: function() {
            var allPercentages = data.allItems.exp.map(function(current){
                return current.getPercentage();
            });
            return allPercentages;
        },   

        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            };
        },

        testing: function() {
            console.log(data);
        }
    };

})();


// UI Module.....Handles UI. Example methods like getInputValues() or UpdateUI()
var UIController = (function() {

    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: ".income__list",
        expensesContainer: ".expenses__list",
        budgetLabel: ".budget__value",
        incomeLabel: ".budget__income--value",
        expensesLabel: ".budget__expenses--value",
        percentageLabel: ".budget__expenses--percentage",
        container: '.container',
        expensesPercentageLabel: '.item__percentage',
        dataLabel: '.budget__title--month'
    };

    var formatNumber = function(num, type) {
        var numSplit, int, dec;
        /*
         + or - before number
         exactly 2 decimal points
         comma separating the thousands eg 2310.4567 -> + 2,310.46 ,,, 2000 -> + 2,000.00
        */

        num = Math.abs(num);
        num = num.toFixed(2);

        numSplit = num.split('.');
        int = numSplit[0];
        if(int.length > 3) {
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);  //input 23510, op 23,510
        }
        
        dec = numSplit[1];

        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
    };

     // creating our own foreach for nodeList
     var nodeListForEach = function(list, callback) {  //
        for(var i = 0; i < list.length; i++) {
            callback(list[i], i); //current, index
        }
    };

    // stuff in return will be public
    return {
        getinput: function() {
            //returning object containing three properties
            return {
                type : document.querySelector(DOMstrings.inputType).value, //can be either exp or inc
                description : document.querySelector(DOMstrings.inputDescription).value,
                value : parseFloat(document.querySelector(DOMstrings.inputValue).value)
            };            
        },

        addListItem: function(obj, type) {
            // newHTML contains item to be inserted. 
            // element is where need to insert
            var html, newHtml, element;  
            
            // Create HTML strin with placeholder text
            if(type === 'inc') {
                element = DOMstrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            }else if(type === 'exp') {
                element = DOMstrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            }
            
            // Replace the placeholder text with actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            // Insert the HTML into the DOM
            // beforeend =  Just inside the element, after its last child.
            // insertAdjacentHTML doc = https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },

        deleteListItem: function(selectorID) {
            // in javascript we can only delete a child
            var element = document.getElementById(selectorID);
            element.parentNode.removeChild(element); 
        },

        clearFields: function() {
            var fields, fieldsArray;
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
        
            // converts NodeList to array, we do this such that we can use forEach
            fieldsArray = Array.prototype.slice.call(fields);     
            
            //call back methods, these args are passed automatically
            fieldsArray.forEach(function(current, index, array) { 
                current.value = "";
            });

            fieldsArray[0].focus();  //focus back to description (ie first field)
        },

        displayBudget: function(obj) {
            var type;
            obj.budget > 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');
            

            if(obj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
            }else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '--';
            }
        },

        displayPercentage: function(percentages){
            // no of items is unknown, so querySelectorAll selects all availabe
            // querySelectorAll returns nodeList. and List does not have all the useful methods like array does
            var fields = document.querySelectorAll(DOMstrings.expensesPercentageLabel);

           

            nodeListForEach(fields, function(current, index) { // second param is a callback function
                if(percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';        
                }else {
                    current.textContent = '--';
                }            
            });

        },

        displayMonth: function() {
            var now, month, months, year;
            now = new Date(); //if no args then will return date of today 
            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 
            'September', 'October', 'November', 'December']
            month = now.getMonth();        
            year = now.getFullYear();        
            document.querySelector(DOMstrings.dataLabel).textContent = months[month] + ' ' + year;
        },

        changedType: function() {
            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue 
            );

            nodeListForEach(fields, function(current) {
                current.classList.toggle('red-focus');  // if red-focus is not in class then it adds it, otherwise it removes
            });

            document.querySelector(DOMstrings.inputBtn).classList.toggle('red'); 
        },

        //Also passing DOMstrings
        getDOMstrings: function() {
            return DOMstrings;
        }
    };

})();


//Controller Module
//Application Controller, for communication between Data Module (BudgetController) and UI Module (UIController)
//It will contain methods like event Handlers
var controller = (function(budgetCtrl, UICtrl) {

    var setupEventListeners = function() {
        var DOM = UICtrl.getDOMstrings();

        //Click listener for add (green tick) btn
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        //Key press listener for return key
        document.addEventListener('keypress', function(event) {
            if(event.keyCode === 13 || event.which == 13) {
                ctrlAddItem();
            }
        });

        // To delete item from container  (Event delegation to container for income and expenses)
        // ctrlDeleteItem is a callback function, written below.
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        // if type is changed from income to expenses then change focus color to red 
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType); 
    };

    var updateBudget = function() {
        // 1. Calculate the budget 
        budgetCtrl.calculateBudget();

        // 2. Return the budget 
        var budget = budgetCtrl.getBudget();

        // 3. Display the budget on the UI
        UICtrl.displayBudget(budget);
    }
    
    var updatePercentage = function() {
        // 1. Calculate percentage
        budgetCtrl.calculatePercentages();
        // 2. Read percentages from the budget controller.. will return array
        var percentages = budgetCtrl.getPercentages();
        // 3. Update the UI with the new percentages  
        UICtrl.displayPercentage(percentages);
    };

    var ctrlAddItem = function() {
        // 1. Get the field input data
        var input = UICtrl.getinput();

        if(input.description != "" && !isNaN(input.value) && input.value > 0) {
            // 2. Add the item to he budget controller
            var newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            // 3. Add the item to the UI and clear field
            UICtrl.addListItem(newItem, input.type);

            // 4. Clear the fields
            UICtrl.clearFields();    

            // 5. Calculate and update budget
            updateBudget();

            // 6. calculate and update percentages
            updatePercentage();
        }
    };

    var ctrlDeleteItem = function(event) {
        // while clicked on cross, event target is just an icon
        // cross is just an icon.. so need to travse DOM till we reach whole item parent
        var itemID, splitID, type, ID;

        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

        if(itemID) { // if exists
            // inc-1
            splitID = itemID.split('-');
            type = splitID[0];  // inc
            ID = parseInt(splitID[1]);    // 1 .. integer

            // 1. delete the item from the data structure
            budgetCtrl.deleteItem(type, ID);
            // 2. delete the item from the UI
            UICtrl.deleteListItem(itemID); 
            // 3. update and show the new budget
            updateBudget();
            // 4. calculate and update percentages
            updatePercentage();
        }
    };

    return {
        init: function() {
            console.log('Application has started')
            UICtrl.displayMonth();
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            setupEventListeners();
        }
    }

})(budgetController, UIController);


controller.init() 