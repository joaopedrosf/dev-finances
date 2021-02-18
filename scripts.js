const Intro = {
    startIntro(){
        const tl = gsap.timeline({defaults: {ease: "power1.out"}})
        tl.to('.hide', {y: '0%', duration: 0.75})
        tl.to('.slider', {y: '-100%', duration: 1.5})
        tl.to('.intro', {y: '-100%', duration: 1}, '-=1.1')
    }
}

const Modal = {
    open() {
        document.querySelector('.modal-overlay').classList.add('active')
    },
    close() {
        Form.clearFields()
        document.querySelector('.modal-overlay').classList.remove('active')
    }
}

const Storage = {
    get() {
        return JSON.parse(localStorage.getItem("dev.finances:transactions")) || []
    },
    set(transactions) {
        localStorage.setItem("dev.finances:transactions", JSON.stringify(transactions))
    },
    removeAll(){
        localStorage.removeItem("dev.finances:transactions")
    }
}

const Transaction = {
    all: Storage.get(),

    add(transaction){
        Transaction.all.push(transaction)

        App.reload()
    },
    remove(index){
        Transaction.all.splice(index, 1)

        App.reload()
    },
    removeAll() {
        Storage.removeAll()
        Transaction.all = []
        App.reload()
    },
    incomes() {
        let incomeAmount = 0
        Transaction.all.forEach(function(transaction) {
            if(transaction.amount > 0) {
                incomeAmount += transaction.amount
            }
        })
        return incomeAmount
    },
    expenses() {
        let expenseAmount = 0
        Transaction.all.forEach(function(transaction) {
            if(transaction.amount < 0) {
                expenseAmount += transaction.amount
            }
        })
        return expenseAmount
    },
    total() {
        return this.incomes() + this.expenses()
    }
}

const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'),

    addTransaction(transaction, index) {
        const tr = document.createElement('tr')
        tr.innerHTML = DOM.innerHTMLTransaction(transaction, index)
        tr.dataset.index = index

        DOM.transactionsContainer.appendChild(tr)
    },
    innerHTMLTransaction(transaction, index) {
        const amountClass = transaction.amount > 0 ? "income" : "expense"
        const descriptionClass = transaction.amount > 0 ? "income-description" : "expense-description"

        const amount = Utils.formatCurrency(transaction.amount)

        const html = `
            <td class="${descriptionClass}">${transaction.description}</td>
            <td class="${amountClass}">${amount}</td>
            <td class="date">${transaction.date}</td>
            <td>
                <img class="remove-transaction" onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="Deletar transação">
            </td>
        `

        return html
    },
    updateBalance() {
        incomeDisplay = document.querySelector('#incomeDisplay')
        expenseDisplay = document.querySelector('#expenseDisplay')
        totalDisplay = document.querySelector('#totalDisplay')
        totalCard = document.querySelector('.card.total')

        incomeDisplay.innerHTML = Utils.formatCurrency(Transaction.incomes())
        expenseDisplay.innerHTML = Utils.formatCurrency(Transaction.expenses())
        totalDisplay.innerHTML = Utils.formatCurrency(Transaction.total())

        if(Transaction.total() < 0) {
            totalCard.classList.add('negative')
        }
        else{
            totalCard.classList.remove('negative')
        }
        
    },
    clearTransactions() {
        this.transactionsContainer.innerHTML = ""
    }
}

const Utils = {

    formatDate(date) {
        const splittedDate = date.split("-")
        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`
    },
    formatAmount(value){
        value = Number(value) * 100

        return value
    },
    formatCurrency(value) {
        const signal = Number(value) < 0 ? "-" : ""

        value = String(value).replace(/\D/g, "")

        value = Number(value) / 100

        value = value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })

        return signal + value
    }
}

const Form = {
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),

    getValues() {
        return {
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value,
        }
    },
    validateFields() {
        const {description, amount, date} = Form.getValues()

        if(description.trim() === "" || amount.trim() === "" || date.trim() === ""){
            throw new Error('Por favor, preencha todos os campos')
        }
    },
    formatValues() {
        let {description, amount, date} = Form.getValues()
        amount = Number(Utils.formatAmount(amount))
        date = Utils.formatDate(date)
        return {
            description,
            amount,
            date
        }
    },
    clearFields() {
        Form.description.value = ""
        Form.amount.value = ""
        Form.date.value = ""
    },
    submit(event) {
        event.preventDefault()

        try {
            // Verifica se os campos não estão vazios
            Form.validateFields()
            // Cria a transação com os dados e adiciona ao Array
            const transaction = Form.formatValues()
            Transaction.add(transaction)
            // Apaga os valores dos campos do formulário e
            // Fecha o Modal
            Modal.close()
            // Reinicia a aplicação com os novos valores já adicionados
        } catch (error) {
            alert(error.message)
        }
        
    }
}

const ChartGenerator = {
    getLabels() {
        let descriptionsHTML = document.getElementsByClassName("expense-description");
        let descriptionsArray = Array.from(descriptionsHTML);
        let descriptionValues = []
        descriptionsArray.forEach(d => {
            descriptionValues.push(d.innerHTML)
        })

        return descriptionValues;
    },
    getExpensesData() {
        let expenseHTML = document.getElementsByClassName("expense");
        let expenseArray = Array.from(expenseHTML);
        let expenseValues = [];

        expenseArray.forEach(e => {
            expenseValues.push(Number(e.innerHTML.replace(/\D/g, "")) / 100);
        })
        return expenseValues;
    },
    generateChart() {
        let ctx = document.getElementById("chart").getContext("2d")
        let colorsHex = ["#f94144ff", "#f3722cff", "#f8961eff", "#f9844aff", "#f9c74fff", "#90be6dff", "#43aa8bff", "#4d908eff", "#577590ff", "#277da1ff"]
        
        try {
            ChartGenerator.chart.destroy()    
        } catch (error) {
            
        }

        ChartGenerator.chart = new Chart(ctx, {
            type: "pie",
            data: {
                datasets: [{
                    data: ChartGenerator.getExpensesData(),
                    backgroundColor: colorsHex
                }],
                labels: ChartGenerator.getLabels()
            },
            options: {
                responsive: true
            }
        })
    }
}

const App = {
    init() {
        Transaction.all.forEach(DOM.addTransaction)
        DOM.updateBalance()
        Storage.set(Transaction.all)
        ChartGenerator.generateChart()
    },
    reload() {
        DOM.clearTransactions()
        App.init()
    }
}

Intro.startIntro()
App.init()


