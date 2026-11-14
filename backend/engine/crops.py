CROPS = {
    "Durum wheat": dict(water=2, n_fix=0.0, market=3, forage=0, sens=[3, 4], cover=[12, 1, 2, 3, 4, 5]),
    "Fava bean": dict(water=2, n_fix=1.0, market=2, forage=1, sens=[2, 3], cover=[12, 1, 2, 3, 4]),
    "Barley + vetch": dict(water=1, n_fix=0.6, market=2, forage=3, sens=[3], cover=[11, 12, 1, 2, 3, 4, 5]),
    "Chickpea": dict(water=1, n_fix=1.0, market=2, forage=0, sens=[4, 5], cover=[3, 4, 5, 6]),
    "Rapeseed / Colza": dict(water=2, n_fix=0.0, market=3, forage=1, sens=[3, 4], cover=[10, 11, 12, 1, 2, 3, 4]),
    "Lentil": dict(water=1, n_fix=0.8, market=2, forage=1, sens=[3, 4], cover=[11, 12, 1, 2, 3, 4]),
    "Oats": dict(water=2, n_fix=0.0, market=2, forage=2, sens=[3, 4], cover=[11, 12, 1, 2, 3, 4, 5]),
    "Alfalfa": dict(water=3, n_fix=0.7, market=2, forage=3, sens=[4, 5, 6], cover=list(range(1, 13))),
}

ROTATIONS = {
    "A": ("Existing: Wheat > Wheat > Wheat", ["Durum wheat"] * 3),
    "B": ("Wheat > Fava bean > Wheat", ["Durum wheat", "Fava bean", "Durum wheat"]),
    "C": ("Wheat > Barley + Vetch > Wheat", ["Durum wheat", "Barley + vetch", "Durum wheat"]),
    "D": ("Wheat > Chickpea > Barley + Vetch", ["Durum wheat", "Chickpea", "Barley + vetch"]),
}
