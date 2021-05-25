require('dotenv').config({ path: __dirname + '/../.env' })

const express = require('express');
const request = require('request');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const auth = {
    user: process.env.PAYPAL_CLIENT_ID,
    pass: process.env.PAYPAL_CLIENT_SECRET
}

// ---------------------------------- PAYMENT ----------------------------------  //

// Função para estabeler os controladores que vamos usar
const createPayment = (req, res) => {

    const body = {
        intent: "CAPTURE",
        purchase_units: [{
            amount: {
                currency_code: "USD",
                value: 1
            }
        }],
        application_context: {
            brand_name: 'Company Name',
            landing_page: 'NO_PREFERENCE', // Default
            user_action: 'PAY_NOW',
            return_url: 'http://localhost:3333/execute-payment',
            cancel_url: 'http://localhost:3333/cancel-payment'
        }
    }

    request.post(`${process.env.PAYPAL_API_URL_SANDBOX}/v2/checkout/orders`, {
        auth,
        body,
        json: true,
    }, (err, response) => {
        res.json({ data: response.body });
    });

}

// Função para capturar o dinheiro do cliente
const executePayment = (req, res) => {
    const token = req.query.token;

    console.log(`${process.env.PAYPAL_API_URL_SANDBOX}/v2/checkout/orders/${token}/capture`);

    request.post(`${PAYPAL_API_URL_SANDBOX}/v2/checkout/orders/${token}/capture`, {
        auth,
        body: {},
        json: true,
    }, (err, response) => {
        res.json({ data: response.body });
    })
}

// Rota para gerar pagina de CHECKOUT
app.post('/create-payment', createPayment);

// Rota para assim que o checkout for realizado, recebermos o dinheiro do cliente
app.post('/execute-payment', executePayment);

// ---------------------------------- SUBSCRIÇÕES ----------------------------------  //

// PRODUCT -> PROD-2L38295369283003E
// PLAN -> P-9SW68628GR990811TMCWDULQ
// SUBSCRIPTION -> I-R6WM25VT8MU5

const createProduct = (req, res) => {
    const product = {
        name: "My Movies dot com",
        description: " Será cobra mensalmente uma assinatura",
        type: "SERVICE",
        category: "SOFTWARE",
        image_url: "https://myimageurl.com/image.png"
    }

    request.post(`${process.env.PAYPAL_API_URL_SANDBOX}/v1/catalogs/products`, {
        auth,
        body: product,
        json: true,
    }, (err, response) => {
        res.json({ data: response.body })
    });
}

const createPlan = (req, res) => {
    const { product_id } = req.body;
    
    const plan = {
        name: "Plano Mensal",
        product_id: product_id,
        status: "ACTIVE",
        billing_cycles: [
            {
                frequency: {
                    interval_unit: "MONTH",
                    interval_count: 1
                },
                tenure_type: "REGULAR",
                sequence: 1,
                total_cycles: 12,
                pricing_scheme: {
                    fixed_price: {
                        value: "3",            // Preço mensal cobrado
                        currency_code: "USD"
                    }
                }
            }
        ],
        payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee: {                       // Taxa de inscrição
                value: "10",
                currency_code: "USD"
            },
            setup_fee_failure_action: "CONTINUE",
            payment_failure_threshold: 3
        },
        taxes: {                               // Imposto
            percentage: "10",                  // ( 10 USD + 10% ) = 11 USD
            inclusive: false
        }
    }

    request.post(`${process.env.PAYPAL_API_URL_SANDBOX}/v1/billing/plans`, {
        auth,
        body: plan,
        json: true
    }, (err, response) => {
        res.json({ data: response.body })
    })
}

const generateSubscription = (req, res) => {
    const { plan_id } = req.body;

    const subscription = {
        plan_id: plan_id,
        start_time: "2021-11-01T00:00:00Z", // Data em que a assinatura começa a ser cobrada
        quantity: 1,                        // quantidade de assinaturas que serão cobradas
        subscriber: {                       // Informações do assinante
            name: {
                given_name: "Leifer",
                surname: "Mendez"
            }
        },
        return_url: "http://localhost/obrigado",
        cancel_url: "http://localhost/falhou"
    }

    request.post(`${process.env.PAYPAL_API_URL_SANDBOX}/v1/billing/subscriptions`, {
        auth,
        body: subscription,
        json: true
    }, (err, response) => {
        res.json({ data: response.body })
    })
}

// Criar um produto no paypal
app.post('/create-product', createProduct);

// Criar um plano no paypal
app.post('/create-plan', createPlan)

// Criar assinatura no paypal
app.post('/generate-subscription', generateSubscription)

module.exports = {
    app
}