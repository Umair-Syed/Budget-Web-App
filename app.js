//Data Module
var budgetController = (function() {

    //constructors
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
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
        percentageLabel: ".budget__expenses--percentage"
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
                html = '<div class="item clearfix" id="income-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            }else if(type === 'exp') {
                element = DOMstrings.expensesContainer;
                html = '<div class="item clearfix" id="expense-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            }
            
            // Replace the placeholder text with actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', obj.value);

            // Insert the HTML into the DOM
            // beforeen =  Just inside the element, after its last child.
            // insertAdjacentHTML doc = https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
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
            document.querySelector(DOMstrings.budgetLabel).textContent = obj.budget;
            document.querySelector(DOMstrings.incomeLabel).textContent = obj.totalInc;
            document.querySelector(DOMstrings.expensesLabel).textContent = obj.totalExp;
            document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage;

            if(obj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
            }else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '--';
            }
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
    };

    var updateBudget = function() {
        // 1. Calculate the budget 
        budgetCtrl.calculateBudget();

        // 2. Return the budget 
        var budget = budgetCtrl.getBudget();

        // 3. Display the budget on the UI
        UICtrl.displayBudget(budget);
    }
    
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
        }
    };

    return {
        init: function() {
            console.log('Application has started')
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