import React, { useState, useContext, useEffect } from 'react'
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react'
import { Context } from "../../store/appContext.js"
import "./Product.module.css"
import Logo from "../../../img/logoHome.png"

export const Product = () => {
    const { store, actions } = useContext(Context)
    const [preferenceIdLocal, setPreferenceIdLocal] = useState(null)
    const price = process.env.SERVICE_PRICE
    const description = process.env.SERVICE_DESCRIPTION

    initMercadoPago(process.env.MERCADOPAGO_PUBLICKEY, {
        locale: 'es-AR',
    });

    useEffect(() => {
        const fetchData = async () => {
            const id = await actions.createPreference()
            if (id) {
                setPreferenceIdLocal(store.preferenceId)
            }
        }
        fetchData();
    }, []);

    return (
        <div className="container">
            <div className='card-product'>
                <div className="card">
                    <img className="w-25" src={Logo} alt='product stuff' />
                    <h3>Consulta psicologica</h3>
                    <p>{description}</p>
                    <p>Total: ${price}</p>
                    <div className="wallet-container">
                        {
                            preferenceIdLocal && <Wallet initialization={{ preferenceId: preferenceIdLocal.id }} />
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}