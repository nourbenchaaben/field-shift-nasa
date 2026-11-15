CROPS = {
    "Durum wheat": dict(water=2, n_fix=0.0, market=3, forage=0, base_yield_t_ha=3.2, water_use_mm=420, price_eur_t=280, sens=[3, 4], cover=[12, 1, 2, 3, 4, 5]),
    "Fava bean": dict(water=2, n_fix=1.0, market=2, forage=1, base_yield_t_ha=2.2, water_use_mm=360, price_eur_t=430, sens=[2, 3], cover=[12, 1, 2, 3, 4]),
    "Barley + vetch": dict(water=1, n_fix=0.6, market=2, forage=3, base_yield_t_ha=3.0, water_use_mm=300, price_eur_t=240, sens=[3], cover=[11, 12, 1, 2, 3, 4, 5]),
    "Chickpea": dict(water=1, n_fix=1.0, market=2, forage=0, base_yield_t_ha=1.7, water_use_mm=280, price_eur_t=650, sens=[4, 5], cover=[3, 4, 5, 6]),
    "Rapeseed / Colza": dict(water=2, n_fix=0.0, market=3, forage=1, base_yield_t_ha=2.1, water_use_mm=430, price_eur_t=470, sens=[3, 4], cover=[10, 11, 12, 1, 2, 3, 4]),
    "Lentil": dict(water=1, n_fix=0.8, market=2, forage=1, base_yield_t_ha=1.5, water_use_mm=260, price_eur_t=600, sens=[3, 4], cover=[11, 12, 1, 2, 3, 4]),
    "Oats": dict(water=2, n_fix=0.0, market=2, forage=2, base_yield_t_ha=2.8, water_use_mm=350, price_eur_t=220, sens=[3, 4], cover=[11, 12, 1, 2, 3, 4, 5]),
    "Alfalfa": dict(water=3, n_fix=0.7, market=2, forage=3, base_yield_t_ha=8.0, water_use_mm=700, price_eur_t=180, sens=[4, 5, 6], cover=list(range(1, 13))),
}

ROTATIONS = {
    "A": ("Existing: Wheat > Wheat > Wheat", ["Durum wheat"] * 3),
    "B": ("Wheat > Fava bean > Wheat", ["Durum wheat", "Fava bean", "Durum wheat"]),
    "C": ("Wheat > Barley + Vetch > Wheat", ["Durum wheat", "Barley + vetch", "Durum wheat"]),
    "D": ("Wheat > Chickpea > Barley + Vetch", ["Durum wheat", "Chickpea", "Barley + vetch"]),
}
