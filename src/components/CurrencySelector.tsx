import React, { useEffect, useState } from 'react';
import api from '../api/axiosConfig';

const CurrencySelector = ({ onCurrencyChange }: { onCurrencyChange: (rate: number, symbol: string) => void }) => {
    const [rates, setRates] = useState<any>({});

    const [selected, setSelected] = useState(localStorage.getItem('currencySymbol') === '€' ? 'EUR' : (localStorage.getItem('currencySymbol') === '$' ? 'USD' : (localStorage.getItem('currencySymbol') === '£' ? 'GBP' : 'TRY')));

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await api.get('/currency/rates');
                if(res.data) {
                    setRates(res.data);
                }
            } catch (e) {
                console.error("Kurlar alınamadı, varsayılan değerler kullanılacak.", e);
            }
        };
        fetchRates();
    }, []);

    const handleChange = (e: any) => {
        const currency = e.target.value;
        setSelected(currency);

        let rate = 1;
        if (currency !== "TRY" && rates && rates[currency]) {
            rate = rates[currency];
        }

        const symbol = currency === "TRY" ? "₺" : (currency === "USD" ? "$" : (currency === "EUR" ? "€" : "£"));

        // Üst bileşene sağlam veri gönder
        onCurrencyChange(rate, symbol);

        // Seçimi kaydet
        localStorage.setItem('currencyRate', rate.toString());
        localStorage.setItem('currencySymbol', symbol);
    };

    return (
        <select
            value={selected}
            onChange={handleChange}
            style={{
                padding: '5px 10px',
                borderRadius: '8px',
                background: '#333',
                color: '#fff',
                border: '1px solid #444',
                fontWeight: 'bold',
                cursor: 'pointer',
                outline: 'none'
            }}
        >
            <option value="TRY">TRY (₺)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
        </select>
    );
};

export default CurrencySelector;