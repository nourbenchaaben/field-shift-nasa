export interface LocalityOption {
  name: string;
  lat: number;
  lng: number;
}

export interface StateOption {
  name: string;
  lat: number;
  lng: number;
  localities: LocalityOption[];
}

export interface CountryAdminHierarchy {
  stateLabel: string;
  localityLabel: string;
  states: StateOption[];
}

/**
 * Compact tuple format: [name, lat, lng] for localities,
 * and [stateName, lat, lng, LocalityTuple[]] for states.
 */
type LocTuple = [string, number, number];
type StateTuple = [string, number, number, LocTuple[]];

function expand(
  stateLabel: string,
  localityLabel: string,
  raw: StateTuple[]
): CountryAdminHierarchy {
  return {
    stateLabel,
    localityLabel,
    states: raw.map(([name, lat, lng, locs]) => ({
      name,
      lat,
      lng,
      localities: locs.map(([lName, lLat, lLng]) => ({
        name: lName,
        lat: lLat,
        lng: lLng,
      })),
    })),
  };
}

export const COUNTRY_LOCATIONS: Record<string, CountryAdminHierarchy> = {
  // =========================================================================
  // TUNISIA: All 24 Governorates & Official Delegations
  // =========================================================================
  TN: expand('Governorate', 'Delegation / Area', [
    [
      'Ariana',
      36.8625,
      10.1956,
      [
        ['Ariana Ville', 36.8625, 10.1956],
        ['Soukra', 36.8833, 10.2469],
        ['Raoued', 36.9553, 10.1847],
        ['Kalâat el-Andalous', 37.0629, 10.1183],
        ['Sidi Thabet', 36.9086, 10.0422],
        ['Ettadhamen', 36.8358, 10.1061],
        ['Mnihla', 36.8547, 10.1233],
      ],
    ],
    [
      'Tunis',
      36.8065,
      10.1815,
      [
        ['La Goulette', 36.8181, 10.305],
        ['Carthage', 36.8528, 10.3233],
        ['Sidi Bou Said', 36.8687, 10.3417],
        ['La Marsa', 36.8782, 10.3247],
        ['Le Kram', 36.8333, 10.3167],
        ['Le Bardo', 36.8092, 10.1406],
        ['El Menzah', 36.8392, 10.1725],
        ['Bab El Bhar', 36.7992, 10.18],
        ['Sidi Hassine', 36.7686, 10.0956],
        ['El Hrairia', 36.7956, 10.1047],
      ],
    ],
    [
      'Ben Arous',
      36.7531,
      10.2189,
      [
        ['Ben Arous', 36.7531, 10.2189],
        ['Mornag', 36.6806, 10.2917],
        ['Fouchana', 36.7014, 10.1714],
        ['Mohamedia', 36.6744, 10.1564],
        ['El Mourouj', 36.7198, 10.2192],
        ['Radès', 36.7681, 10.2753],
        ['Hammam Lif', 36.7286, 10.3417],
        ['Hammam Chott', 36.719, 10.3643],
        ['Ezzahra', 36.7439, 10.3083],
        ['Mégrine', 36.7686, 10.2367],
        ['Bou Mhel el-Bassatine', 36.7253, 10.3044],
      ],
    ],
    [
      'Manouba',
      36.8101,
      10.0956,
      [
        ['Manouba', 36.8101, 10.0956],
        ['Tebourba', 36.8295, 9.8411],
        ['Jedaida', 36.8475, 9.9369],
        ['Mornaguia', 36.7606, 10.0172],
        ['Borj El Amri', 36.7192, 9.8933],
        ['Oued Ellil', 36.8342, 10.0406],
        ['El Battan', 36.8047, 9.845],
        ['Douar Hicher', 36.8253, 10.0928],
      ],
    ],
    [
      'Bizerte',
      37.2744,
      9.8739,
      [
        ['Bizerte Nord', 37.2744, 9.8739],
        ['Zarzouna', 37.2642, 9.8767],
        ['Mateur', 37.0405, 9.6656],
        ['Menzel Bourguiba', 37.1537, 9.7859],
        ['Menzel Jemil', 37.2393, 9.913],
        ['Tinja', 37.1639, 9.7706],
        ['El Alia', 37.1689, 10.0339],
        ['Ras Jebel', 37.215, 10.12],
        ['Utique', 37.0564, 10.0622],
        ['Ghar El Melh', 37.1694, 10.1906],
        ['Sejnane', 37.0572, 9.2381],
        ['Ghezala', 37.0689, 9.5469],
        ['Joumine', 36.9733, 9.4886],
      ],
    ],
    [
      'Béja',
      36.7256,
      9.1817,
      [
        ['Béja Nord', 36.7256, 9.1817],
        ['Medjez el-Bab', 36.6496, 9.6123],
        ['Testour', 36.5513, 9.4431],
        ['Teboursouk', 36.4569, 9.2475],
        ['Goubellat', 36.5419, 9.6625],
        ['Nefza', 36.9736, 9.0764],
        ['Amdoun', 36.7611, 9.0833],
        ['Thibar', 36.5269, 9.1106],
      ],
    ],
    [
      'Jendouba',
      36.5011,
      8.7802,
      [
        ['Jendouba', 36.5011, 8.7802],
        ['Bou Salem', 36.6111, 8.9698],
        ['Tabarka', 36.9544, 8.758],
        ['Aïn Draham', 36.7781, 8.6872],
        ['Ghardimaou', 36.4503, 8.4397],
        ['Fernana', 36.6556, 8.6961],
        ['Oued Meliz', 36.4681, 8.5494],
        ['Balta-Bou Aouane', 36.695, 8.9522],
      ],
    ],
    [
      'Kef',
      36.1742,
      8.7049,
      [
        ['Le Kef Est', 36.1742, 8.7049],
        ['Dahmani', 35.9424, 8.8284],
        ['Tajerouine', 35.8917, 8.5528],
        ['Jérissa', 35.8451, 8.6303],
        ['Kalaat Khasba', 35.6626, 8.5858],
        ['Touiref', 36.3406, 8.587],
        ['Nebeur', 36.2944, 8.7658],
        ['Sakiet Sidi Youssef', 36.2229, 8.3555],
        ['El Ksour', 35.8961, 8.885],
        ['Sers', 36.0764, 9.0217],
        ['Kalaat Senan', 35.7644, 8.3428],
      ],
    ],
    [
      'Siliana',
      36.0849,
      9.3708,
      [
        ['Siliana Nord', 36.0849, 9.3708],
        ['Bou Arada', 36.3525, 9.6217],
        ['Gaâfour', 36.3204, 9.3242],
        ['El Aroussa', 36.3833, 9.45],
        ['Sidi Bou Rouis', 36.1767, 9.1235],
        ['Makthar', 35.858, 9.2007],
        ['El Krib', 36.328, 9.1361],
        ['Bargou', 36.0933, 9.5758],
        ['Rouhia', 35.6761, 9.0519],
        ['Kesra', 35.8136, 9.3647],
      ],
    ],
    [
      'Nabeul',
      36.4561,
      10.7376,
      [
        ['Nabeul', 36.4561, 10.7376],
        ['Béni Khiar', 36.4694, 10.781],
        ['Dar Chaabane El Fehri', 36.4666, 10.7478],
        ['Hammamet', 36.4, 10.6167],
        ['Grombalia', 36.6, 10.5],
        ['Soliman', 36.6964, 10.4917],
        ['Korba', 36.5786, 10.8586],
        ['Menzel Temime', 36.7833, 10.9875],
        ['Kélibia', 36.8476, 11.0939],
        ['Hammam El Ghezaz', 36.874, 11.1082],
        ['El Haouaria', 37.05, 11.0144],
        ['Takelsa', 36.7932, 10.6751],
        ['El Mida', 36.7212, 10.858],
        ['Menzel Bouzelfa', 36.6831, 10.5842],
        ['Béni Khalled', 36.6504, 10.59],
        ['Bou Argoub', 36.5385, 10.5509],
      ],
    ],
    [
      'Zaghouan',
      36.4029,
      10.1429,
      [
        ['Zaghouan', 36.4029, 10.1429],
        ['El Fahs', 36.3742, 9.9065],
        ['Bir Mcherga', 36.5136, 10.0086],
        ['Nadhour', 36.1136, 10.0942],
        ['Saouaf', 36.2289, 10.1681],
        ['Zriba', 36.3389, 10.2528],
      ],
    ],
    [
      'Sousse',
      35.8256,
      10.6084,
      [
        ['Sousse Ville', 35.8256, 10.6084],
        ['Hammam Sousse', 35.875, 10.5935],
        ['Akouda', 35.8657, 10.5678],
        ['Zaouiet Sousse', 35.7855, 10.6273],
        ['Msaken', 35.7292, 10.5808],
        ['Enfidha', 36.1353, 10.3808],
        ['Kalaa Kebira', 35.8719, 10.5368],
        ['Kalaa Seghira', 35.8236, 10.5586],
        ['Bouficha', 36.2975, 10.4533],
        ['Sidi Bou Ali', 35.9567, 10.4731],
        ['Sidi El Hani', 35.6714, 10.3158],
        ['Kondar', 35.9317, 10.3017],
        ['Hergla', 36.0303, 10.509],
      ],
    ],
    [
      'Monastir',
      35.7643,
      10.8113,
      [
        ['Monastir', 35.7643, 10.8113],
        ['Moknine', 35.6297, 10.9008],
        ['Jemmal', 35.6223, 10.757],
        ['Ksar Hellal', 35.6477, 10.8905],
        ['Téboulba', 35.6417, 10.9667],
        ['Bekalta', 35.6173, 10.9891],
        ['Beni Hassen', 35.5671, 10.808],
        ['Ouerdanine', 35.7152, 10.6676],
        ['Ksibet el-Médiouni', 35.6885, 10.842],
        ['Sayada', 35.6683, 10.8913],
        ['Zéramdine', 35.5681, 10.7353],
        ['Sahline', 35.7517, 10.7111],
        ['Bembla', 35.6997, 10.8008],
      ],
    ],
    [
      'Mahdia',
      35.5047,
      11.0622,
      [
        ['Mahdia', 35.5047, 11.0622],
        ['Rejiche', 35.4667, 11.0385],
        ['El Jem', 35.3, 10.7167],
        ['Ksour Essef', 35.4181, 10.9947],
        ['Chebba', 35.2372, 11.115],
        ['Melloulèche', 35.1655, 11.0355],
        ['Sidi Alouane', 35.3751, 10.939],
        ['Souassi', 35.3431, 10.5486],
        ['Chorbane', 35.2856, 10.3858],
        ['Bou Merdes', 35.515, 10.7422],
        ['Hebira', 35.2681, 10.4556],
      ],
    ],
    [
      'Sfax',
      34.7406,
      10.7603,
      [
        ['Sfax Ville', 34.7406, 10.7603],
        ['Sakiet Ezzit', 34.8024, 10.7613],
        ['Sakiet Eddaïer', 34.7896, 10.78],
        ['El Amra', 34.9837, 10.8955],
        ['Ghraiba', 34.4956, 10.2111],
        ['Agareb', 34.7441, 10.4611],
        ['Jebiniana', 35.035, 10.9081],
        ['El Hencha', 35.1217, 10.7469],
        ['Mahrès', 34.5289, 10.5],
        ['Skhira', 34.2992, 10.0699],
        ['Bir Ali Ben Khalifa', 34.7359, 10.0924],
        ['Menzel Chaker', 34.9628, 10.3711],
        ['Kerkennah', 34.7064, 11.2019],
      ],
    ],
    [
      'Kairouan',
      35.6781,
      10.0963,
      [
        ['Kairouan Nord', 35.6781, 10.0963],
        ['Sbikha', 35.9333, 10.0208],
        ['Haffouz', 35.6324, 9.6762],
        ['Oueslatia', 35.845, 9.5881],
        ['Bou Hajla', 35.3983, 10.0369],
        ['Echrarda', 35.1182, 10.0337],
        ['Nasrallah', 35.3653, 9.8728],
        ['Chebika', 35.6164, 9.9364],
        ['El Alâa', 35.6144, 9.5586],
        ['Hajeb El Ayoun', 35.3947, 9.5478],
      ],
    ],
    [
      'Kasserine',
      35.1676,
      8.8365,
      [
        ['Kasserine Nord', 35.1676, 8.8365],
        ['Sbeitla', 35.2298, 9.1294],
        ['Fériana', 34.9489, 8.5694],
        ['Thala', 35.5724, 8.6703],
        ['Haïdra', 35.5663, 8.4441],
        ['Foussana', 35.3447, 8.6225],
        ['Sbiba', 35.5433, 9.0736],
        ['Jedelienne', 35.5653, 8.9522],
        ['Majel Bel Abbès', 34.7364, 8.5269],
      ],
    ],
    [
      'Sidi Bouzid',
      35.0382,
      9.4849,
      [
        ['Sidi Bouzid Ouest', 35.0382, 9.4849],
        ['Regueb', 34.8593, 9.7865],
        ['Jelma', 35.2731, 9.4239],
        ['Souk Jedid', 34.9418, 9.5651],
        ['Meknassy', 34.6039, 9.6031],
        ['Bir El Hafey', 34.9321, 9.1932],
        ['Sidi Ali Ben Aoun', 34.8442, 9.2167],
        ['Mezzouna', 34.5776, 9.8419],
        ['Menzel Bouzaiane', 34.7128, 9.4422],
      ],
    ],
    [
      'Gabès',
      33.8815,
      10.0982,
      [
        ['Gabès Ville', 33.8815, 10.0982],
        ['El Hamma', 33.8915, 9.7963],
        ['Mareth', 33.6333, 10.2833],
        ['Métouia', 33.96, 10.0],
        ['Oudhref', 33.9833, 9.9704],
        ['Ghannouch', 33.9397, 10.065],
        ['Matmata', 33.5444, 9.9714],
        ['Nouvelle Matmata', 33.6589, 9.9614],
      ],
    ],
    [
      'Medenine',
      33.3549,
      10.5055,
      [
        ['Medenine Nord', 33.3549, 10.5055],
        ['Zarzis', 33.504, 11.1122],
        ['Ben Gardane', 33.1378, 11.2197],
        ['Djerba Houmt Souk', 33.8758, 10.8575],
        ['Djerba Midoun', 33.8081, 10.9923],
        ['Djerba Ajim', 33.7264, 10.7566],
        ['Beni Khedache', 33.2528, 10.1997],
        ['Sidi Makhlouf', 33.5533, 10.4833],
      ],
    ],
    [
      'Tataouine',
      32.9297,
      10.4518,
      [
        ['Tataouine Nord', 32.9297, 10.4518],
        ['Ghomrassen', 33.0592, 10.34],
        ['Bir Lahmar', 33.1786, 10.4369],
        ['Remada', 32.3167, 10.4],
        ['Dehiba', 32.008, 10.7014],
        ['Smâr', 32.9925, 10.8964],
      ],
    ],
    [
      'Gafsa',
      34.425,
      8.7842,
      [
        ['Gafsa Sud', 34.425, 8.7842],
        ['Métlaoui', 34.3208, 8.4016],
        ['Moularès', 34.4888, 8.2687],
        ['Belkhir', 34.2742, 9.3911],
        ['Sidi Aïch', 34.7326, 8.7828],
        ['El Guettar', 34.3372, 8.9483],
        ['El Ksar', 34.3992, 8.804],
        ['Mdhilla', 34.2547, 8.7586],
        ['Redeyef', 34.3827, 8.1555],
        ['Sned', 34.4628, 9.264],
      ],
    ],
    [
      'Tozeur',
      33.9197,
      8.1335,
      [
        ['Tozeur', 33.9197, 8.1335],
        ['Nefta', 33.8731, 7.8777],
        ['Degache', 33.9761, 8.2081],
        ['Tameghza', 34.3885, 7.9431],
        ['Hazoua', 33.7294, 7.5906],
      ],
    ],
    [
      'Kebili',
      33.7044,
      8.969,
      [
        ['Kebili Sud', 33.7044, 8.969],
        ['Douz Nord', 33.4663, 9.0203],
        ['Souk Lahad', 33.7606, 8.8842],
        ['El Faouar', 33.3478, 8.6817],
        ['Rjim Maatoug', 33.3211, 7.9917],
      ],
    ],
  ]),

  // =========================================================================
  // NORTH AFRICA & MIDDLE EAST
  // =========================================================================
  MA: expand('Region', 'Province / City', [
    ['Fès-Meknès', 33.8935, -5.5473, [['Meknès', 33.8935, -5.5473], ['Fès', 34.0181, -5.0078], ['Ifrane', 33.5228, -5.1109], ['El Hajeb', 33.6879, -5.371], ['Taounate', 34.5369, -4.6401]]],
    ['Rabat-Salé-Kénitra', 34.261, -6.5802, [['Kénitra', 34.261, -6.5802], ['Sidi Kacem', 34.2214, -5.7078], ['Sidi Slimane', 34.2648, -5.926], ['Khémisset', 33.824, -6.0663], ['Rabat', 34.0209, -6.8416]]],
    ['Casablanca-Settat', 33.001, -7.6166, [['Settat', 33.001, -7.6166], ['Berrechid', 33.2655, -7.5875], ['El Jadida', 33.2316, -8.5007], ['Sidi Bennour', 32.6524, -8.4277], ['Benslimane', 33.6122, -7.1211]]],
    ['Marrakech-Safi', 31.6295, -7.9811, [['Marrakech', 31.6295, -7.9811], ['El Kelâa des Sraghna', 32.0481, -7.4083], ['Safi', 32.2994, -9.2372], ['Essaouira', 31.5085, -9.7595], ['Chichaoua', 31.544, -8.7662]]],
    ['Béni Mellal-Khénifra', 32.3373, -6.3498, [['Béni Mellal', 32.3373, -6.3498], ['Fquih Ben Salah', 32.5021, -6.6877], ['Khouribga', 32.8811, -6.9063], ['Azilal', 31.9616, -6.5711]]],
    ['Souss-Massa', 30.4278, -9.5981, [['Agadir', 30.4278, -9.5981], ['Taroudant', 30.4703, -8.877], ['Chtouka-Aït Baha', 30.0689, -9.1525], ['Tiznit', 29.6974, -9.7316]]],
    ['Tanger-Tétouan-Al Hoceïma', 35.1688, -5.2684, [['Larache', 35.1932, -6.1557], ['Chefchaouen', 35.1688, -5.2684], ['Tétouan', 35.5889, -5.3626], ['Ouezzane', 34.7978, -5.5822]]],
    ['Oriental', 34.9227, -2.3294, [['Berkane', 34.92, -2.32], ['Oujda', 34.6814, -1.9086], ['Nador', 35.1681, -2.9335], ['Guercif', 34.2257, -3.3536]]],
  ]),

  DZ: expand('Wilaya', 'District / Town', [
    ['Sétif', 36.1911, 5.4137, [['Sétif', 36.1911, 5.4137], ['El Eulma', 36.1528, 5.6902], ['Aïn Oulmène', 35.9189, 5.295], ['Bougaa', 36.3329, 5.0884]]],
    ['Blida', 36.47, 2.8277, [['Blida', 36.47, 2.8277], ['Boufarik', 36.5741, 2.9121], ['El Affroun', 36.4701, 2.6253], ['Mouzaia', 36.467, 2.6899]]],
    ['Tiaret', 35.371, 1.317, [['Tiaret', 35.371, 1.317], ['Sougueur', 35.1857, 1.4961], ['Frenda', 35.0654, 1.0495], ['Mahdia', 35.4297, 1.7571]]],
    ['Constantine', 36.365, 6.6147, [['Constantine', 36.365, 6.6147], ['El Khroub', 36.2633, 6.6936], ['Hamma Bouziane', 36.4121, 6.596], ['Zighoud Youcef', 36.5331, 6.7124]]],
    ['Guelma', 36.4621, 7.4261, [['Guelma', 36.4621, 7.4261], ['Oued Zenati', 36.3164, 7.1636], ['Bouchegouf', 36.4633, 7.7278], ['Héliopolis', 36.5036, 7.4428]]],
    ['Mostaganem', 35.9311, 0.0892, [['Mostaganem', 35.9311, 0.0892], ['Aïn Tedles', 35.9991, 0.2998], ['Sidi Ali', 36.0998, 0.4171], ['Mesra', 35.8447, 0.1669]]],
    ['Biskra', 34.8504, 5.7281, [['Biskra', 34.8504, 5.7281], ['Tolga', 34.7222, 5.3784], ['Sidi Okba', 34.7451, 5.8983], ['El Kantara', 35.2256, 5.7058]]],
    ['El Oued', 33.3561, 6.8632, [['El Oued', 33.3561, 6.8632], ['Guemar', 33.4918, 6.7968], ['Debila', 33.5167, 6.95], ['Robbah', 33.2797, 6.9098]]],
    ['Tlemcen', 34.8783, -1.315, [['Tlemcen', 34.8783, -1.315], ['Maghnia', 34.8497, -1.727], ['Remchi', 35.062, -1.4336], ['Sebdou', 34.637, -1.3314]]],
  ]),

  EG: expand('Governorate', 'District / Town', [
    ['Dakahlia', 31.0409, 31.3785, [['Mansoura', 31.0409, 31.3785], ['Mit Ghamr', 30.7163, 31.2627], ['Talkha', 31.0539, 31.3779], ['Aga', 30.9416, 31.2944]]],
    ['Sharqia', 30.5877, 31.502, [['Zagazig', 30.5877, 31.502], ['Belbeis', 30.4204, 31.5622], ['Faqous', 30.7302, 31.7972], ['Abu Hammad', 30.5286, 31.6719]]],
    ['Beheira', 31.0341, 30.4682, [['Damanhour', 31.0341, 30.4682], ['Kafr El Dawwar', 31.1338, 30.1297], ['Kom Hamada', 30.7611, 30.6997], ['Wadi El Natrun', 30.386, 30.3514]]],
    ['Gharbia', 30.7865, 31.0004, [['Tanta', 30.7865, 31.0004], ['El-Mahalla El-Kubra', 30.9706, 31.1669], ['Kafr El-Zayat', 30.8248, 30.818], ['Zifta', 30.7142, 31.2443]]],
    ['Faiyum', 29.3084, 30.8428, [['Faiyum', 29.3084, 30.8428], ['Sinnuris', 29.4085, 30.8651], ['Itsa', 29.2376, 30.7894], ['Tamiya', 29.4764, 30.9612]]],
    ['Minya', 28.0871, 30.7618, [['Minya', 28.0871, 30.7618], ['Mallawi', 27.7314, 30.8417], ['Samalut', 28.3121, 30.7101], ['Beni Mazar', 28.4961, 30.8029]]],
    ['Kafr El Sheikh', 31.1107, 30.9388, [['Kafr El Sheikh', 31.1107, 30.9388], ['Desouk', 31.1326, 30.6479], ['Baltim', 31.5542, 31.0933], ['Sidi Salem', 31.2713, 30.7862]]],
  ]),

  JO: expand('Governorate', 'District / Town', [
    ['Irbid', 32.5568, 35.8469, [['Irbid', 32.5568, 35.8469], ['Al-Aghwar Al-Shamaliyah', 32.596, 35.595], ['Ramtha', 32.5587, 36.0082], ['Bani Kinanah', 32.683, 35.768]]],
    ['Balqa', 32.0392, 35.7272, [['Al-Salt', 32.0392, 35.7272], ['Deir Alla', 32.1981, 35.6223], ['Shuna Al-Janubiyyah', 31.8944, 35.6164]]],
    ['Mafraq', 32.3429, 36.208, [['Mafraq', 32.3429, 36.208], ['Badia', 32.25, 36.55], ['Ruwaished', 32.5015, 38.204]]],
    ['Madaba', 31.7197, 35.7956, [['Madaba', 31.7197, 35.7956], ['Dhiban', 31.498, 35.7819]]],
    ['Karak', 31.1853, 35.7048, [['Karak', 31.1853, 35.7048], ['Ghor Al-Safi', 31.0361, 35.4654], ['Mazar Al-Janubi', 31.0672, 35.6949]]],
  ]),

  SA: expand('Province', 'Governorate / Oasis', [
    ['Al-Qassim', 26.326, 43.975, [['Buraidah', 26.326, 43.975], ['Unaizah', 26.084, 43.9935], ['Ar Rass', 25.8694, 43.4973], ['Al Bukayriyah', 26.1422, 43.6594]]],
    ['Al-Jouf', 29.9697, 40.2064, [['Sakaka', 29.9697, 40.2064], ['Dumat Al-Jandal', 29.8153, 39.8664], ['Al Qurayyat', 31.3318, 37.3428]]],
    ['Hail', 27.5114, 41.7208, [['Hail', 27.5114, 41.7208], ['Baqaa', 27.8872, 42.3964], ['Al-Shinan', 27.1753, 42.4414]]],
    ['Riyadh', 24.1556, 47.3346, [['Al-Kharj', 24.1556, 47.3346], ['Wadi Al-Dawasir', 20.4648, 44.7897], ['Al-Zulfi', 26.2995, 44.8154]]],
    ['Eastern Province', 25.3833, 49.5833, [['Al-Ahsa (Hofuf)', 25.3833, 49.5833], ['Qatif', 26.5196, 50.0115]]],
  ]),

  LB: expand('Governorate', 'District / Town', [
    ['Beqaa', 33.8463, 35.902, [['Zahlé', 33.8463, 35.902], ['West Beqaa (Joub Jannine)', 33.6275, 35.7836], ['Rashaya', 33.5017, 35.8442], ['Chtaura', 33.8167, 35.85]]],
    ['Baalbek-Hermel', 34.0047, 36.211, [['Baalbek', 34.0047, 36.211], ['Hermel', 34.3942, 36.3847], ['Deir El Ahmar', 34.1278, 36.1319]]],
    ['Akkar', 34.5506, 36.0781, [['Halba', 34.5506, 36.0781], ['Qoubaiyat', 34.5681, 36.2781], ['Bibnine', 34.5131, 36.0131]]],
    ['South Lebanon', 33.5614, 35.3714, [['Sidon', 33.5614, 35.3714], ['Tyre', 33.2705, 35.2038], ['Jezzine', 33.5417, 35.5844]]],
  ]),

  // =========================================================================
  // EUROPE
  // =========================================================================
  FR: expand('Region', 'Department / Town', [
    ['Pays de la Loire', 47.4784, -0.5632, [['Angers (Maine-et-Loire)', 47.4784, -0.5632], ['Nantes (Loire-Atlantique)', 47.2184, -1.5536], ['Le Mans (Sarthe)', 48.0061, 0.1996], ['La Roche-sur-Yon (Vendée)', 46.6705, -1.4264]]],
    ['Centre-Val de Loire', 48.4439, 1.489, [['Chartres (Beauce)', 48.4439, 1.489], ['Orléans (Loiret)', 47.9029, 1.9093], ['Tours (Indre-et-Loire)', 47.3941, 0.6848], ['Bourges (Cher)', 47.081, 2.3988]]],
    ['Nouvelle-Aquitaine', 44.8378, -0.5792, [['Bordeaux (Gironde)', 44.8378, -0.5792], ['Poitiers (Vienne)', 46.5802, 0.3404], ['Agen (Lot-et-Garonne)', 44.2031, 0.6164], ['Pau (Pyrénées-Atlantiques)', 43.2951, -0.3708]]],
    ['Occitanie', 43.6047, 1.4442, [['Toulouse (Haute-Garonne)', 43.6047, 1.4442], ['Montpellier (Hérault)', 43.6108, 3.8767], ['Auch (Gers)', 43.6464, 0.5867], ['Carcassonne (Aude)', 43.213, 2.3491]]],
    ['Grand Est', 49.2583, 4.0317, [['Reims (Marne)', 49.2583, 4.0317], ['Troyes (Aube)', 48.2973, 4.0744], ['Strasbourg (Bas-Rhin)', 48.5734, 7.7521], ['Nancy (Meurthe-et-Moselle)', 48.6921, 6.1844]]],
    ['Hauts-de-France', 49.8941, 2.2958, [['Amiens (Somme)', 49.8941, 2.2958], ['Arras (Pas-de-Calais)', 50.291, 2.7775], ['Laon (Aisne)', 49.5641, 3.6199], ['Lille (Nord)', 50.6292, 3.0573]]],
    ['Bretagne', 48.1173, -1.6778, [['Rennes (Ille-et-Vilaine)', 48.1173, -1.6778], ['Quimper (Finistère)', 47.9975, -4.0979], ['Saint-Brieuc (Côtes-d’Armor)', 48.5141, -2.7658]]],
    ['Normandie', 49.1829, -0.3707, [['Caen (Calvados)', 49.1829, -0.3707], ['Évreux (Eure)', 49.027, 1.1514], ['Rouen (Seine-Maritime)', 49.4432, 1.0999]]],
  ]),

  ES: expand('Autonomous Community', 'Province / Town', [
    ['Andalucía', 37.3891, -5.9845, [['Sevilla', 37.3891, -5.9845], ['Córdoba', 37.8882, -4.7794], ['Jaén', 37.7796, -3.7849], ['Almería', 36.834, -2.4637], ['Jerez de la Frontera', 36.685, -6.1261]]],
    ['Castilla y León', 41.6523, -4.7245, [['Valladolid', 41.6523, -4.7245], ['Burgos', 42.3439, -3.6969], ['León', 42.5987, -5.5671], ['Salamanca', 40.9701, -5.6635]]],
    ['Castilla-La Mancha', 38.9848, -3.9274, [['Ciudad Real', 38.9848, -3.9274], ['Albacete', 38.9943, -1.8585], ['Toledo', 39.8628, -4.0273], ['Cuenca', 40.0704, -2.1374]]],
    ['Aragón', 41.6488, -0.8891, [['Zaragoza', 41.6488, -0.8891], ['Huesca', 42.1401, -0.4089], ['Teruel', 40.3456, -1.1065]]],
    ['Cataluña', 41.6176, 0.62, [['Lleida', 41.6176, 0.62], ['Tarragona', 41.1189, 1.2445], ['Girona', 41.9794, 2.8214]]],
    ['Comunidad Valenciana', 39.4699, -0.3763, [['Valencia', 39.4699, -0.3763], ['Alicante', 38.3452, -0.481], ['Castellón', 39.9864, -0.0513]]],
    ['Extremadura', 38.8794, -6.9707, [['Badajoz', 38.8794, -6.9707], ['Mérida', 38.9161, -6.3437], ['Cáceres', 39.4753, -6.3724]]],
    ['Murcia', 37.9922, -1.1307, [['Murcia', 37.9922, -1.1307], ['Lorca', 37.6712, -1.7017], ['Cartagena', 37.6257, -0.9966]]],
  ]),

  IT: expand('Region', 'Province / Town', [
    ['Emilia-Romagna', 44.6471, 10.9252, [['Modena', 44.6471, 10.9252], ['Bologna', 44.4949, 11.3426], ['Parma', 44.8015, 10.3279], ['Ferrara', 44.8381, 11.6198], ['Ravenna', 44.4184, 12.2035]]],
    ['Lombardia', 45.1332, 10.0227, [['Cremona', 45.1332, 10.0227], ['Mantova', 45.1564, 10.7914], ['Pavia', 45.1847, 9.1582], ['Brescia', 45.5416, 10.2118]]],
    ['Veneto', 45.4064, 11.8768, [['Padova', 45.4064, 11.8768], ['Verona', 45.4384, 10.9916], ['Rovigo', 45.0703, 11.7901], ['Treviso', 45.6669, 12.243]]],
    ['Piemonte', 45.3202, 8.4186, [['Vercelli', 45.3202, 8.4186], ['Cuneo', 44.3845, 7.5427], ['Alessandria', 44.9122, 8.6153], ['Asti', 44.9008, 8.2064]]],
    ['Toscana', 43.3188, 11.3308, [['Siena', 43.3188, 11.3308], ['Grosseto', 42.7635, 11.1124], ['Arezzo', 43.4633, 11.8796], ['Pisa', 43.7228, 10.4017]]],
    ['Puglia', 41.4622, 15.5446, [['Foggia', 41.4622, 15.5446], ['Bari', 41.1171, 16.8719], ['Lecce', 40.3515, 18.175], ['Taranto', 40.4644, 17.247]]],
    ['Sicilia', 37.5079, 15.083, [['Catania', 37.5079, 15.083], ['Ragusa', 36.9269, 14.7255], ['Agrigento', 37.3111, 13.5765], ['Trapani', 38.0176, 12.5362]]],
  ]),

  DE: expand('State (Land)', 'District / Town', [
    ['Saxony-Anhalt', 52.1205, 11.6276, [['Magdeburg', 52.1205, 11.6276], ['Halle (Saale)', 51.4969, 11.9688], ['Börde', 52.238, 11.391], ['Stendal', 52.605, 11.859]]],
    ['Lower Saxony', 52.3759, 9.732, [['Hannover', 52.3759, 9.732], ['Oldenburg', 53.1435, 8.2146], ['Osnabrück', 52.2799, 8.0472], ['Hildesheim', 52.1548, 9.9579]]],
    ['Bavaria', 48.7665, 11.4257, [['Ingolstadt', 48.7665, 11.4257], ['Regensburg', 49.0134, 12.1016], ['Straubing', 48.8813, 12.5697], ['Würzburg', 49.7913, 9.9534]]],
    ['North Rhine-Westphalia', 51.9607, 7.6261, [['Münster', 51.9607, 7.6261], ['Paderborn', 51.7189, 8.7575], ['Soest', 51.5711, 8.1066], ['Kleve', 51.7893, 6.1381]]],
    ['Mecklenburg-Vorpommern', 53.8655, 12.1743, [['Güstrow', 53.7939, 12.1764], ['Neubrandenburg', 53.5569, 13.2612], ['Rostock', 54.0924, 12.0991]]],
    ['Brandenburg', 52.3906, 13.0645, [['Potsdam', 52.3906, 13.0645], ['Prenzlau (Uckermark)', 53.3168, 13.8634], ['Neuruppin', 52.9222, 12.8054]]],
    ['Baden-Württemberg', 49.1427, 9.2109, [['Heilbronn', 49.1427, 9.2109], ['Ulm', 48.4011, 9.9876], ['Freiburg', 47.999, 7.8421]]],
  ]),

  GB: expand('Region / Nation', 'County / Town', [
    ['East of England', 52.2053, 0.1218, [['Cambridgeshire', 52.2053, 0.1218], ['Norfolk', 52.6309, 1.2974], ['Suffolk', 52.1872, 0.9708], ['Essex', 51.7343, 0.4691]]],
    ['East Midlands', 53.2307, -0.5406, [['Lincolnshire', 53.2307, -0.5406], ['Northamptonshire', 52.2405, -0.9027], ['Nottinghamshire', 53.1001, -0.985]]],
    ['Yorkshire & Humber', 53.9591, -1.0815, [['North Yorkshire', 54.15, -1.45], ['East Riding of Yorkshire', 53.8419, -0.4359]]],
    ['South West England', 50.7184, -3.5339, [['Devon', 50.7184, -3.5339], ['Somerset', 51.1051, -2.9262], ['Wiltshire', 51.3492, -1.9927]]],
    ['Scotland', 56.395, -3.4308, [['Perthshire', 56.395, -3.4308], ['Aberdeenshire', 57.28, -2.38], ['Scottish Borders', 55.6, -2.78]]],
    ['Wales', 52.2405, -3.3792, [['Powys', 52.3, -3.42], ['Carmarthenshire', 51.8572, -4.3121]]],
  ]),

  NL: expand('Province', 'Municipality / Area', [
    ['Flevoland', 52.5185, 5.4714, [['Lelystad', 52.5185, 5.4714], ['Dronten', 52.525, 5.7181], ['Noordoostpolder (Emmeloord)', 52.7106, 5.7486], ['Zeewolde', 52.33, 5.5417]]],
    ['Groningen', 53.2194, 6.5665, [['Groningen', 53.2194, 6.5665], ['Oldambt', 53.1447, 7.0339], ['Het Hogeland', 53.36, 6.58]]],
    ['North Brabant', 51.5606, 5.0919, [['Tilburg', 51.5606, 5.0919], ['Breda', 51.5719, 4.7683], ['Eindhoven', 51.4416, 5.4697]]],
    ['Gelderland', 51.97, 5.6654, [['Wageningen', 51.97, 5.6654], ['Arnhem', 51.9851, 5.8987], ['Achterhoek (Doetinchem)', 51.965, 6.2889]]],
    ['Zeeland', 51.5014, 3.8892, [['Goes', 51.5014, 3.8892], ['Middelburg', 51.4988, 3.611], ['Terneuzen', 51.3358, 3.8278]]],
    ['South Holland', 52.0116, 4.3571, [['Westland', 51.995, 4.215], ['Gouda', 52.0115, 4.7105]]],
  ]),

  PT: expand('Region', 'District / Town', [
    ['Alentejo', 38.5714, -7.9135, [['Évora', 38.5714, -7.9135], ['Beja', 38.0151, -7.8632], ['Portalegre', 39.2967, -7.4285], ['Elvas', 38.8815, -7.1628]]],
    ['Ribatejo & Oeste', 39.2362, -8.6871, [['Santarém', 39.2362, -8.6871], ['Leiria', 39.7436, -8.8071], ['Torres Vedras', 39.0911, -9.2586]]],
    ['Norte', 41.3006, -7.7441, [['Vila Real (Douro)', 41.3006, -7.7441], ['Braga', 41.5454, -8.4265], ['Bragança', 41.8061, -6.7567]]],
    ['Centro', 40.2033, -8.4103, [['Coimbra', 40.2033, -8.4103], ['Castelo Branco', 39.8222, -7.4909], ['Viseu', 40.6566, -7.9125]]],
    ['Algarve', 37.0194, -7.9322, [['Faro', 37.0194, -7.9322], ['Silves', 37.1897, -8.4386], ['Tavira', 37.1273, -7.6486]]],
  ]),

  GR: expand('Region', 'Regional Unit / Town', [
    ['Thessaly', 39.639, 22.4191, [['Larissa', 39.639, 22.4191], ['Trikala', 39.5557, 21.7679], ['Karditsa', 39.364, 21.9214], ['Volos', 39.3666, 22.9507]]],
    ['Central Macedonia', 40.6401, 22.9444, [['Thessaloniki', 40.6401, 22.9444], ['Serres', 41.085, 23.5476], ['Pella (Giannitsa)', 40.7918, 22.411], ['Imathia (Veria)', 40.5244, 22.2024]]],
    ['Peloponnese', 37.0389, 22.1142, [['Kalamata (Messenia)', 37.0389, 22.1142], ['Sparta (Laconia)', 37.0755, 22.4303], ['Corinth', 37.9407, 22.9573]]],
    ['Crete', 35.3387, 25.1442, [['Heraklion', 35.3387, 25.1442], ['Chania', 35.5138, 24.018], ['Messara Plain', 35.055, 24.925]]],
    ['East Macedonia & Thrace', 41.135, 24.888, [['Xanthi', 41.135, 24.888], ['Komotini', 41.1224, 25.4066], ['Drama', 41.1528, 24.1473]]],
  ]),

  TR: expand('Province', 'District / Town', [
    ['Konya', 37.8746, 32.4932, [['Konya', 37.8746, 32.4932], ['Çumra', 37.5732, 32.7745], ['Ereğli', 37.5133, 34.0467], ['Karapınar', 37.7158, 33.5506]]],
    ['Adana', 37.0, 35.3213, [['Adana (Çukurova)', 37.0, 35.3213], ['Ceyhan', 37.0247, 35.8175], ['Kozan', 37.4552, 35.8157]]],
    ['Şanlıurfa', 37.1591, 38.7969, [['Şanlıurfa', 37.1591, 38.7969], ['Harran', 36.8639, 39.0314], ['Siverek', 37.755, 39.3167], ['Viranşehir', 37.2353, 39.7631]]],
    ['İzmir', 38.4237, 27.1428, [['İzmir', 38.4237, 27.1428], ['Ödemiş', 38.2292, 27.9711], ['Torbalı', 38.1519, 27.3619], ['Bergama', 39.1207, 27.1805]]],
    ['Antalya', 36.8969, 30.7133, [['Antalya', 36.8969, 30.7133], ['Kumluca', 36.3703, 30.2869], ['Serik', 36.9165, 31.0989], ['Manavgat', 36.7867, 31.4431]]],
    ['Ankara', 39.9334, 32.8597, [['Polatlı', 39.5842, 32.1472], ['Haymana', 39.4322, 32.4972], ['Beypazarı', 40.1675, 31.9211]]],
    ['Edirne', 41.6818, 26.5623, [['Edirne', 41.6818, 26.5623], ['Keşan', 40.8558, 26.6303], ['Uzunköprü', 41.2694, 26.6861]]],
  ]),

  PL: expand('Voivodeship', 'County / Town', [
    ['Greater Poland', 52.4064, 16.9252, [['Poznań', 52.4064, 16.9252], ['Kalisz', 51.7611, 18.091], ['Leszno', 51.8403, 16.5749], ['Gniezno', 52.5349, 17.5826]]],
    ['Masovia', 52.2297, 21.0122, [['Warsaw', 52.2297, 21.0122], ['Płock', 52.5463, 19.7065], ['Siedlce', 52.1676, 22.2902], ['Grójec', 51.8655, 20.8676]]],
    ['Kuyavian-Pomeranian', 53.0138, 18.5984, [['Toruń', 53.0138, 18.5984], ['Bydgoszcz', 53.1235, 18.0084], ['Inowrocław', 52.7931, 18.2611]]],
    ['Lower Silesia', 51.1079, 17.0385, [['Wrocław', 51.1079, 17.0385], ['Legnica', 51.207, 16.1553], ['Świdnica', 50.8438, 16.4886]]],
    ['Lublin', 51.2465, 22.5684, [['Lublin', 51.2465, 22.5684], ['Zamość', 50.7231, 23.2519], ['Chełm', 51.1431, 23.4712]]],
  ]),

  UA: expand('Oblast', 'District / Town', [
    ['Cherkasy', 49.4444, 32.0598, [['Cherkasy', 49.4444, 32.0598], ['Uman', 48.7487, 30.2218], ['Smila', 49.2224, 31.8871]]],
    ['Poltava', 49.5883, 34.5514, [['Poltava', 49.5883, 34.5514], ['Kremenchuk', 49.0658, 33.41], ['Myrhorod', 49.9658, 33.6114]]],
    ['Vinnytsia', 49.2331, 28.4682, [['Vinnytsia', 49.2331, 28.4682], ['Zhmerynka', 49.037, 28.112], ['Mohyliv-Podilskyi', 48.4453, 27.7853]]],
    ['Kyiv', 50.4501, 30.5234, [['Bila Tserkva', 49.7968, 30.1169], ['Boryspil', 50.3516, 30.9557], ['Fastiv', 50.0794, 29.9182]]],
    ['Odesa', 46.4825, 30.7233, [['Odesa', 46.4825, 30.7233], ['Izmail', 45.3502, 28.8369], ['Podilsk', 47.7419, 29.535]]],
    ['Lviv', 49.8397, 24.0297, [['Lviv', 49.8397, 24.0297], ['Drohobych', 49.3547, 23.5059], ['Stryi', 49.2615, 23.8505]]],
  ]),

  RO: expand('Region', 'County / Town', [
    ['Muntenia', 44.4268, 26.1025, [['Călărași', 44.2051, 27.3136], ['Ialomița (Slobozia)', 44.5644, 27.3636], ['Teleorman (Alexandria)', 43.972, 25.3315], ['Prahova (Ploiești)', 44.9462, 26.0254]]],
    ['Banat', 45.7489, 21.2087, [['Timiș (Timișoara)', 45.7489, 21.2087], ['Arad', 46.1866, 21.3123]]],
    ['Oltenia', 44.3302, 23.7949, [['Dolj (Craiova)', 44.3302, 23.7949], ['Olt (Slatina)', 44.4298, 24.3642]]],
    ['Dobrogea', 44.1598, 28.6348, [['Constanța', 44.1598, 28.6348], ['Tulcea', 45.1716, 28.7914]]],
    ['Transylvania', 46.7712, 23.6236, [['Cluj-Napoca', 46.7712, 23.6236], ['Sibiu', 45.7983, 24.1256], ['Mureș (Târgu Mureș)', 46.5386, 24.5514]]],
    ['Moldova', 47.1585, 27.6014, [['Iași', 47.1585, 27.6014], ['Botoșani', 47.7486, 26.6694], ['Galați', 45.4353, 28.008]]],
  ]),

  // =========================================================================
  // AMERICAS
  // =========================================================================
  US: expand('State', 'County / City', [
    ['Iowa', 42.0308, -93.6319, [['Ames (Story County)', 42.0308, -93.6319], ['Des Moines', 41.5868, -93.625], ['Cedar Rapids', 41.9779, -91.6656], ['Sioux City', 42.4963, -96.4049]]],
    ['Illinois', 40.1164, -88.2434, [['Champaign', 40.1164, -88.2434], ['Springfield', 39.7817, -89.6501], ['Peoria', 40.6936, -89.589], ['Bloomington', 40.4842, -88.9937]]],
    ['California', 36.7378, -119.7871, [['Fresno (Central Valley)', 36.7378, -119.7871], ['Salinas Valley', 36.6777, -121.6555], ['Bakersfield', 35.3733, -119.0187], ['Sacramento Valley', 38.5816, -121.4944]]],
    ['Nebraska', 40.8136, -96.7026, [['Lincoln', 40.8136, -96.7026], ['Grand Island', 40.9264, -98.342], ['North Platte', 41.1239, -100.7654], ['Scottsbluff', 41.8666, -103.6672]]],
    ['Kansas', 38.8403, -97.6114, [['Salina', 38.8403, -97.6114], ['Wichita', 37.6872, -97.3301], ['Dodge City', 37.7528, -100.0171], ['Manhattan', 39.1836, -96.5717]]],
    ['Texas', 33.5779, -101.8552, [['Lubbock (High Plains)', 33.5779, -101.8552], ['Amarillo', 35.222, -101.8313], ['McAllen (Rio Grande)', 26.2034, -98.23], ['Waco', 31.5493, -97.1467]]],
    ['Minnesota', 44.1636, -93.9994, [['Mankato', 44.1636, -93.9994], ['Rochester', 44.0121, -92.4802], ['Moorhead (Red River)', 46.8738, -96.7678]]],
    ['Indiana', 40.4167, -86.8753, [['Lafayette', 40.4167, -86.8753], ['Fort Wayne', 41.0793, -85.1394], ['Evansville', 37.9716, -87.5711]]],
    ['Wisconsin', 43.0731, -89.4012, [['Madison', 43.0731, -89.4012], ['Green Bay', 44.5133, -88.0133], ['Eau Claire', 44.8113, -91.4985]]],
    ['Washington', 46.6021, -120.5059, [['Yakima Valley', 46.6021, -120.5059], ['Walla Walla', 46.0646, -118.343], ['Pullman (Palouse)', 46.7298, -117.1817]]],
  ]),

  CA: expand('Province', 'Region / City', [
    ['Saskatchewan', 50.4452, -104.6189, [['Regina', 50.4452, -104.6189], ['Saskatoon', 52.1332, -106.67], ['Swift Current', 50.2881, -107.7939], ['Yorkton', 51.2139, -102.4628]]],
    ['Alberta', 51.0447, -114.0719, [['Lethbridge', 49.6956, -112.8451], ['Red Deer', 52.2681, -113.8112], ['Grande Prairie', 55.1707, -118.7947], ['Medicine Hat', 50.0405, -110.6764]]],
    ['Manitoba', 49.8951, -97.1384, [['Winnipeg', 49.8951, -97.1384], ['Brandon', 49.8485, -99.9501], ['Portage la Prairie', 49.9728, -98.2926]]],
    ['Ontario', 43.5448, -80.2482, [['Guelph', 43.5448, -80.2482], ['London', 42.9849, -81.2453], ['Chatham-Kent', 42.4048, -82.191], ['Niagara', 43.0896, -79.0849]]],
    ['Quebec', 45.6275, -72.9571, [['Saint-Hyacinthe', 45.6275, -72.9571], ['Montérégie', 45.36, -73.25], ['Beauce', 46.12, -70.67]]],
    ['British Columbia', 49.888, -119.496, [['Kelowna (Okanagan)', 49.888, -119.496], ['Abbotsford (Fraser Valley)', 49.0504, -122.3045]]],
  ]),

  MX: expand('State', 'Municipality / Region', [
    ['Guanajuato', 20.6736, -101.354, [['Irapuato', 20.6736, -101.354], ['Celaya', 20.5289, -100.8157], ['León', 21.125, -101.686], ['Salamanca', 20.5739, -101.1957]]],
    ['Sinaloa', 24.8091, -107.394, [['Culiacán', 24.8091, -107.394], ['Los Mochis', 25.7905, -108.9859], ['Guasave', 25.5667, -108.4667]]],
    ['Jalisco', 20.6597, -103.3496, [['Guadalajara', 20.6597, -103.3496], ['Ciudad Guzmán', 19.7042, -103.4619], ['Lagos de Moreno', 21.3569, -101.929]]],
    ['Sonora', 27.4828, -109.9304, [['Ciudad Obregón (Yaqui Valley)', 27.4828, -109.9304], ['Hermosillo', 29.073, -110.9559], ['Navojoa', 27.0713, -109.4437]]],
    ['Michoacán', 19.4112, -102.0564, [['Uruapan', 19.4112, -102.0564], ['Zamora', 19.9855, -102.2839], ['Morelia', 19.706, -101.195]]],
    ['Chihuahua', 28.633, -106.0691, [['Delicias', 28.1901, -105.4701], ['Cuauhtémoc', 28.4088, -106.8632]]],
  ]),

  BR: expand('State', 'Municipality / Region', [
    ['Mato Grosso', -12.5425, -55.7211, [['Sorriso', -12.5425, -55.7211], ['Sinop', -11.8604, -55.5091], ['Lucas do Rio Verde', -13.058, -55.9041], ['Rondonópolis', -16.4673, -54.6372]]],
    ['Paraná', -24.9555, -53.4552, [['Cascavel', -24.9555, -53.4552], ['Londrina', -23.3045, -51.1696], ['Maringá', -23.4205, -51.9333], ['Ponta Grossa', -25.0916, -50.1668]]],
    ['Rio Grande do Sul', -28.2624, -52.409, [['Passo Fundo', -28.2624, -52.409], ['Cruz Alta', -28.6386, -53.6064], ['Pelotas', -31.7654, -52.3376]]],
    ['Goiás', -17.7923, -50.9192, [['Rio Verde', -17.7923, -50.9192], ['Jataí', -17.8814, -51.7144], ['Cristalina', -16.7686, -47.6136]]],
    ['São Paulo', -21.1775, -47.8103, [['Ribeirão Preto', -21.1775, -47.8103], ['Piracicaba', -22.7338, -47.6476], ['Campinas', -22.9099, -47.0626]]],
    ['Bahia', -12.1483, -44.9925, [['Luís Eduardo Magalhães', -12.0928, -45.7867], ['Barreiras', -12.1483, -44.9925], ['Juazeiro', -9.4167, -40.5033]]],
    ['Minas Gerais', -18.9186, -48.2772, [['Uberlândia', -18.9186, -48.2772], ['Uberaba', -19.7472, -47.9381], ['Patos de Minas', -18.5794, -46.5184]]],
  ]),

  AR: expand('Province', 'Department / City', [
    ['Buenos Aires', -33.8908, -60.5736, [['Pergamino', -33.8908, -60.5736], ['Tandil', -37.3217, -59.1332], ['Junín', -34.5838, -60.9433], ['Tres Arroyos', -38.3739, -60.2798]]],
    ['Santa Fe', -32.9442, -60.6505, [['Rosario', -32.9442, -60.6505], ['Venado Tuerto', -33.7456, -61.9688], ['Rafaela', -31.2503, -61.4867]]],
    ['Córdoba', -33.1232, -64.3493, [['Río Cuarto', -33.1232, -64.3493], ['Marcos Juárez', -32.6978, -62.1067], ['Villa María', -32.4075, -63.2402]]],
    ['Entre Ríos', -31.7413, -60.5115, [['Paraná', -31.7413, -60.5115], ['Gualeguaychú', -33.0094, -58.5172], ['Concordia', -31.393, -58.0209]]],
    ['Mendoza', -32.8895, -68.8458, [['Mendoza', -32.8895, -68.8458], ['San Rafael', -34.6177, -68.3301], ['Tunuyán (Uco Valley)', -33.5778, -69.0189]]],
    ['Tucumán', -26.8083, -65.2176, [['San Miguel de Tucumán', -26.8083, -65.2176], ['Concepción', -27.3458, -65.5892]]],
  ]),

  CO: expand('Department', 'Municipality', [
    ['Risaralda & Caldas', 4.8133, -75.6961, [['Pereira', 4.8133, -75.6961], ['Manizales', 5.0703, -75.5138], ['Chinchiná', 4.9831, -75.6033]]],
    ['Valle del Cauca', 3.4516, -76.532, [['Palmira', 3.5394, -76.3036], ['Tuluá', 4.0847, -76.1954], ['Buga', 3.9009, -76.2978]]],
    ['Cundinamarca', 4.8624, -74.0587, [['Chía', 4.8624, -74.0587], ['Zipaquirá', 5.0221, -74.0048], ['Fusagasugá', 4.3365, -74.3638]]],
    ['Antioquia', 6.2442, -75.5812, [['Rionegro', 6.1552, -75.3737], ['Urabá (Apartadó)', 7.883, -76.6259], ['Andes', 5.6561, -75.8781]]],
    ['Tolima', 4.4389, -75.2322, [['Ibagué', 4.4389, -75.2322], ['Espinal', 4.1492, -74.8843]]],
    ['Meta', 4.142, -73.6266, [['Villavicencio', 4.142, -73.6266], ['Puerto López', 4.0891, -72.956]]],
  ]),

  PE: expand('Region', 'Province / Valley', [
    ['Cusco', -13.3106, -72.1167, [['Urubamba (Sacred Valley)', -13.3047, -72.1162], ['Calca', -13.3211, -71.9561], ['Anta', -13.4614, -72.1489]]],
    ['La Libertad', -8.1116, -79.0287, [['Trujillo (Chao/Virú)', -8.4167, -78.75], ['Chepén', -7.2264, -79.4292], ['Pacasmayo', -7.4006, -79.5714]]],
    ['Ica', -14.0678, -75.7286, [['Ica', -14.0678, -75.7286], ['Chincha', -13.4099, -76.1323], ['Pisco', -13.7103, -76.2054]]],
    ['Piura', -5.1945, -80.6328, [['Piura', -5.1945, -80.6328], ['Sullana', -4.9039, -80.6853], ['Chulucanas', -5.0925, -80.1625]]],
    ['Arequipa', -16.409, -71.5375, [['Majes Valley', -16.357, -72.19], ['Arequipa', -16.409, -71.5375]]],
  ]),

  CL: expand('Region', 'Province / Valley', [
    ['Maule', -35.4264, -71.6554, [['Talca', -35.4264, -71.6554], ['Curicó', -34.9828, -71.2394], ['Linares', -35.8454, -71.598]]],
    ['O’Higgins', -34.1708, -70.7444, [['Rancagua', -34.1708, -70.7444], ['San Fernando (Colchagua)', -34.5838, -70.9891], ['Santa Cruz', -34.6388, -71.3658]]],
    ['Biobío & Ñuble', -36.6066, -72.1034, [['Chillán', -36.6066, -72.1034], ['Los Ángeles', -37.4689, -72.3527]]],
    ['Araucanía', -38.7359, -72.5904, [['Temuco', -38.7359, -72.5904], ['Victoria', -38.2329, -72.3329], ['Angol', -37.7988, -72.7086]]],
    ['Valparaíso', -32.8803, -71.2484, [['Quillota', -32.8803, -71.2484], ['San Felipe (Aconcagua)', -32.7498, -70.7258]]],
  ]),

  // =========================================================================
  // ASIA & OCEANIA
  // =========================================================================
  IN: expand('State', 'District / City', [
    ['Punjab', 30.901, 75.8573, [['Ludhiana', 30.901, 75.8573], ['Amritsar', 31.634, 74.8723], ['Patiala', 30.3398, 76.3869], ['Bathinda', 30.211, 74.9455], ['Jalandhar', 31.326, 75.5762]]],
    ['Haryana', 29.6857, 76.9905, [['Karnal', 29.6857, 76.9905], ['Hisar', 29.1492, 75.7217], ['Kurukshetra', 29.9695, 76.8783], ['Sirsa', 29.5321, 75.0318]]],
    ['Uttar Pradesh', 28.9845, 77.7064, [['Meerut', 28.9845, 77.7064], ['Lucknow', 26.8467, 80.9462], ['Varanasi', 25.3176, 82.9739], ['Agra', 27.1767, 78.0081]]],
    ['Maharashtra', 19.9975, 73.7898, [['Nashik', 19.9975, 73.7898], ['Pune', 18.5204, 73.8567], ['Nagpur', 21.1458, 79.0882], ['Kolhapur', 16.705, 74.2433]]],
    ['Madhya Pradesh', 22.7196, 75.8577, [['Indore', 22.7196, 75.8577], ['Bhopal', 23.2599, 77.4126], ['Ujjain', 23.1765, 75.7885], ['Jabalpur', 23.1815, 79.9864]]],
    ['Gujarat', 22.5645, 72.9289, [['Anand', 22.5645, 72.9289], ['Rajkot', 22.3039, 70.8022], ['Mehsana', 23.588, 72.3693], ['Junagadh', 21.5222, 70.4579]]],
    ['Tamil Nadu', 10.787, 79.1378, [['Thanjavur (Cauvery Delta)', 10.787, 79.1378], ['Coimbatore', 11.0168, 76.9558], ['Madurai', 9.9252, 78.1198]]],
    ['Rajasthan', 29.9038, 73.8772, [['Sri Ganganagar', 29.9038, 73.8772], ['Jaipur', 26.9124, 75.7873], ['Kota', 25.2138, 75.8648]]],
  ]),

  PK: expand('Province', 'District / City', [
    ['Punjab', 31.4504, 73.135, [['Faisalabad', 31.4504, 73.135], ['Multan', 30.1575, 71.5249], ['Sahiwal', 30.6682, 73.1114], ['Gujranwala', 32.1877, 74.1945], ['Bahawalpur', 29.3956, 71.6836]]],
    ['Sindh', 25.396, 68.3578, [['Hyderabad', 25.396, 68.3578], ['Sukkur', 27.7052, 68.8574], ['Larkana', 27.559, 68.212], ['Mirpur Khas', 25.5276, 69.0159]]],
    ['Khyber Pakhtunkhwa', 34.0151, 71.5249, [['Peshawar', 34.0151, 71.5249], ['Mardan', 34.1989, 72.0231], ['Swat', 34.7717, 72.3602]]],
    ['Balochistan', 30.1798, 66.975, [['Quetta', 30.1798, 66.975], ['Nasirabad', 28.613, 68.18]]],
  ]),

  CN: expand('Province', 'Prefecture / City', [
    ['Henan', 34.7466, 113.6253, [['Zhengzhou', 34.7466, 113.6253], ['Zhoukou', 33.6258, 114.6969], ['Nanyang', 32.9906, 112.5283], ['Zhumadian', 32.9802, 114.0223]]],
    ['Shandong', 36.7069, 119.1618, [['Weifang (Shouguang)', 36.7069, 119.1618], ['Jinan', 36.6512, 117.1201], ['Dezhou', 37.4341, 116.3575], ['Yantai', 37.4638, 121.4479]]],
    ['Heilongjiang', 45.8038, 126.5349, [['Harbin', 45.8038, 126.5349], ['Jiamusi (Sanjiang Plain)', 46.7999, 130.3189], ['Qiqihar', 47.3543, 123.9182]]],
    ['Jiangsu', 32.0603, 118.7969, [['Yancheng', 33.3474, 120.1636], ['Xuzhou', 34.2044, 117.2841], ['Yangzhou', 32.3942, 119.4129]]],
    ['Sichuan', 30.5728, 104.0668, [['Chengdu Plain', 30.5728, 104.0668], ['Mianyang', 31.4675, 104.6791], ['Deyang', 31.1269, 104.3979]]],
    ['Xinjiang', 43.8256, 87.6168, [['Shihezi', 44.3059, 86.0804], ['Aksu', 41.1688, 80.2606], ['Kashgar', 39.4677, 75.9938]]],
  ]),

  JP: expand('Prefecture', 'District / City', [
    ['Hokkaido', 43.0618, 141.3545, [['Obihiro (Tokachi Plain)', 42.9239, 143.1961], ['Asahikawa', 43.7706, 142.3649], ['Kitami', 43.8031, 143.8908], ['Sapporo', 43.0618, 141.3545]]],
    ['Niigata', 37.9162, 139.0364, [['Niigata (Echigo Plain)', 37.9162, 139.0364], ['Uonuma', 37.2361, 138.9631], ['Nagaoka', 37.4462, 138.8513]]],
    ['Ibaraki', 36.3659, 140.4712, [['Tsukuba', 36.0835, 140.0764], ['Mito', 36.3659, 140.4712], ['Hokota', 36.1586, 140.5161]]],
    ['Nagano', 36.6485, 138.1942, [['Matsumoto', 36.238, 137.972], ['Nagano', 36.6485, 138.1942], ['Ina Valley', 35.8276, 137.9538]]],
    ['Kumamoto', 32.8032, 130.7079, [['Kumamoto', 32.8032, 130.7079], ['Yatsushiro', 32.5076, 130.6014], ['Aso', 32.9508, 131.1235]]],
  ]),

  VN: expand('Province / Region', 'District / City', [
    ['Cần Thơ (Mekong Delta)', 10.0452, 105.7469, [['Cần Thơ', 10.0452, 105.7469], ['Thốt Nốt', 10.2708, 105.5333], ['Cờ Đỏ', 10.0958, 105.4306]]],
    ['An Giang', 10.3864, 105.4352, [['Long Xuyên', 10.3864, 105.4352], ['Châu Đốc', 10.7056, 105.1119], ['Thoại Sơn', 10.2583, 105.2667]]],
    ['Đồng Tháp', 10.4547, 105.6331, [['Cao Lãnh', 10.4547, 105.6331], ['Sa Đéc', 10.2923, 105.7564], ['Tháp Mười', 10.525, 105.84]]],
    ['Đắk Lắk (Central Highlands)', 12.6667, 108.05, [['Buôn Ma Thuột', 12.6667, 108.05], ['Krông Pắk', 12.7167, 108.3333]]],
    ['Thái Bình (Red River Delta)', 20.4463, 106.3366, [['Thái Bình', 20.4463, 106.3366], ['Đông Hưng', 20.55, 106.35]]],
  ]),

  ID: expand('Province', 'Regency / City', [
    ['East Java', -7.2575, 112.7521, [['Malang', -7.9666, 112.6326], ['Kediri', -7.848, 112.0178], ['Jember', -8.1845, 113.6681], ['Lamongan', -7.1167, 112.4167]]],
    ['Central Java', -6.9667, 110.4167, [['Semarang', -6.9667, 110.4167], ['Klaten', -7.7058, 110.6064], ['Brebes', -6.8732, 109.0422], ['Grobogan', -7.0833, 110.9167]]],
    ['West Java', -6.3056, 107.3025, [['Karawang', -6.3056, 107.3025], ['Indramayu', -6.3276, 108.3249], ['Subang', -6.5716, 107.7587], ['Bandung (Lembang)', -6.8117, 107.6175]]],
    ['South Sulawesi', -5.1477, 119.4327, [['Bone', -4.5386, 120.3279], ['Pinrang', -3.7858, 119.6522], ['Wajo', -4.1264, 120.032]]],
    ['Lampung', -5.1115, 105.3067, [['Central Lampung', -4.8667, 105.2667], ['Metro', -5.1131, 105.3067]]],
  ]),

  TH: expand('Province', 'District (Amphoe)', [
    ['Phra Nakhon Si Ayutthaya', 14.3532, 100.5689, [['Ayutthaya', 14.3532, 100.5689], ['Bang Pa-in', 14.2303, 100.5797], ['Sena', 14.3264, 100.4042]]],
    ['Suphan Buri', 14.4745, 100.1177, [['Suphan Buri', 14.4745, 100.1177], ['Si Prachan', 14.6422, 100.1489], ['Song Phi Nong', 14.2256, 100.0503]]],
    ['Nakhon Ratchasima', 14.9799, 102.0978, [['Nakhon Ratchasima', 14.9799, 102.0978], ['Pak Chong', 14.7081, 101.4161], ['Phimai', 15.2233, 102.4944]]],
    ['Chiang Mai', 18.7883, 98.9853, [['Chiang Mai', 18.7883, 98.9853], ['Fang', 19.9167, 99.2167], ['San Pa Tong', 18.6278, 98.8958]]],
    ['Khon Kaen', 16.4419, 102.836, [['Khon Kaen', 16.4419, 102.836], ['Chum Phae', 16.5442, 102.0994]]],
  ]),

  AU: expand('State', 'Region / Town', [
    ['New South Wales', -35.1082, 147.3598, [['Wagga Wagga (Riverina)', -35.1082, 147.3598], ['Griffith', -34.2898, 146.0454], ['Tamworth', -31.0927, 150.932], ['Dubbo', -32.2569, 148.6011]]],
    ['Western Australia', -31.6531, 116.6683, [['Northam (Wheatbelt)', -31.6531, 116.6683], ['Geraldton', -28.7774, 114.615], ['Esperance', -33.8613, 121.8914], ['Merredin', -31.4833, 118.2833]]],
    ['Victoria', -36.711, 142.1998, [['Horsham (Wimmera)', -36.711, 142.1998], ['Shepparton', -36.3833, 145.4], ['Mildura (Mallee)', -34.1855, 142.1625]]],
    ['Queensland', -27.5598, 151.9507, [['Toowoomba (Darling Downs)', -27.5598, 151.9507], ['Emerald', -23.5273, 148.1646], ['Bundaberg', -24.8661, 152.3489]]],
    ['South Australia', -33.8333, 138.6167, [['Clare Valley', -33.8333, 138.6167], ['Barossa Valley', -34.5333, 138.95], ['Port Lincoln (Eyre)', -34.724, 135.8586]]],
  ]),

  NZ: expand('Region', 'District / Town', [
    ['Canterbury', -43.532, 172.6362, [['Ashburton', -43.9023, 171.7501], ['Christchurch', -43.532, 172.6362], ['Timaru', -44.397, 171.255], ['Rangiora', -43.3036, 172.5964]]],
    ['Waikato', -37.787, 175.2793, [['Hamilton', -37.787, 175.2793], ['Matamata', -37.8087, 175.7746], ['Te Awamutu', -38.0108, 175.3248]]],
    ['Hawke’s Bay', -39.6381, 176.8492, [['Hastings', -39.6381, 176.8492], ['Napier', -39.4928, 176.912]]],
    ['Otago & Southland', -46.1014, 168.9436, [['Gore', -46.1014, 168.9436], ['Invercargill', -46.4132, 168.3538], ['Alexandra', -45.2491, 169.3797]]],
    ['Manawatū-Whanganui', -40.3523, 175.6082, [['Palmerston North', -40.3523, 175.6082], ['Feilding', -40.2248, 175.5653]]],
  ]),

  // =========================================================================
  // SUB-SAHARAN AFRICA
  // =========================================================================
  KE: expand('County', 'Sub-County / Town', [
    ['Nakuru', -0.3031, 36.08, [['Nakuru', -0.3031, 36.08], ['Naivasha', -0.7172, 36.431], ['Molo', -0.2485, 35.7319], ['Njoro', -0.3333, 35.9433]]],
    ['Uasin Gishu', 0.5143, 35.2698, [['Eldoret', 0.5143, 35.2698], ['Moiben', 0.8167, 35.3833], ['Soy', 0.65, 35.15]]],
    ['Trans-Nzoia', 1.0157, 35.0062, [['Kitale', 1.0157, 35.0062], ['Endebess', 1.0764, 34.8531], ['Kiminini', 0.8964, 34.9228]]],
    ['Kiambu', -1.1714, 36.8356, [['Thika', -1.0332, 37.0693], ['Limuru', -1.1069, 36.642], ['Githunguri', -1.0586, 36.7775]]],
    ['Meru', 0.0463, 37.6559, [['Meru', 0.0463, 37.6559], ['Timau', 0.0886, 37.2439], ['Maua', 0.2333, 37.9333]]],
    ['Narok', -1.0783, 35.8601, [['Narok', -1.0783, 35.8601], ['Kilgoris', -1.0028, 34.875]]],
  ]),

  ET: expand('Region', 'Zone / Town', [
    ['Oromia', 8.54, 39.27, [['Adama', 8.54, 39.27], ['Asella (Arsi)', 7.95, 39.1333], ['Bishoftu', 8.7523, 38.9785], ['Jimma', 7.6734, 36.8344], ['Shashamane', 7.2, 38.6]]],
    ['Amhara', 11.5742, 37.3614, [['Bahir Dar', 11.5742, 37.3614], ['Debre Markos (Gojjam)', 10.3333, 37.7333], ['Gondar', 12.6, 37.4667], ['Dessie', 11.1333, 39.6333]]],
    ['Sidama & South', 7.0621, 38.4763, [['Hawassa', 7.0621, 38.4763], ['Yirgalem', 6.75, 38.4167], ['Arba Minch', 6.0333, 37.55]]],
    ['Tigray', 13.4967, 39.4753, [['Mekelle', 13.4967, 39.4753], ['Shire', 14.1, 38.2833]]],
  ]),

  NG: expand('State', 'LGA / City', [
    ['Kaduna', 10.5105, 7.4165, [['Kaduna', 10.5105, 7.4165], ['Zaria', 11.0855, 7.7199], ['Kafanchan', 9.5813, 8.2926]]],
    ['Kano', 12.0022, 8.592, [['Kano', 12.0022, 8.592], ['Kura', 11.7723, 8.4263], ['Wudil', 11.8094, 8.8442]]],
    ['Benue', 7.7322, 8.5391, [['Makurdi', 7.7322, 8.5391], ['Gboko', 7.3228, 9.0011], ['Otukpo', 7.1922, 8.133]]],
    ['Oyo', 7.3775, 3.947, [['Ibadan', 7.3775, 3.947], ['Ogbomoso', 8.1337, 4.2401], ['Iseyin (Oke-Ogun)', 7.9765, 3.5914]]],
    ['Niger', 9.6139, 6.5569, [['Minna', 9.6139, 6.5569], ['Bida', 9.0804, 6.01], ['Mokwa', 9.2948, 5.0541]]],
    ['Ogun', 7.1475, 3.3619, [['Abeokuta', 7.1475, 3.3619], ['Ijebu Ode', 6.8194, 3.9173]]],
  ]),

  GH: expand('Region', 'District / Town', [
    ['Bono & Bono East', 7.5909, -1.9344, [['Techiman', 7.5909, -1.9344], ['Sunyani', 7.3349, -2.3123], ['Kintampo', 8.0563, -1.7306]]],
    ['Northern', 9.4034, -0.8424, [['Tamale', 9.4034, -0.8424], ['Yendi', 9.4427, -0.0099], ['Savelugu', 9.6244, -0.8253]]],
    ['Ashanti', 6.6885, -1.6244, [['Kumasi', 6.6885, -1.6244], ['Ejura', 7.3856, -1.3562], ['Mampong', 7.0627, -1.4001]]],
    ['Eastern', 6.0941, -0.2591, [['Koforidua', 6.0941, -0.2591], ['Nkawkaw', 6.5512, -0.7662], ['Afram Plains', 7.03, -0.18]]],
    ['Volta', 6.6008, 0.4713, [['Ho', 6.6008, 0.4713], ['Hohoe', 7.1518, 0.4736], ['Sogakope', 6.0044, 0.5975]]],
  ]),

  ZA: expand('Province', 'District / Town', [
    ['Free State', -28.4793, 26.2041, [['Bloemfontein', -29.0852, 26.1596], ['Bothaville', -27.3887, 26.617], ['Bethlehem', -28.2308, 28.3071], ['Kroonstad', -27.6504, 27.2349]]],
    ['Western Cape', -33.6465, 19.4485, [['Worcester (Breede)', -33.6465, 19.4485], ['Paarl (Winelands)', -33.7342, 18.9621], ['Malmesbury (Swartland)', -33.4608, 18.7271], ['Ceres', -33.3689, 19.3109]]],
    ['Mpumalanga', -26.5193, 29.9856, [['Ermelo', -26.5193, 29.9856], ['Mbombela (Nelspruit)', -25.4753, 30.9694], ['Standerton', -26.9337, 29.2415]]],
    ['North West', -26.1467, 26.1597, [['Lichtenburg', -26.152, 26.1597], ['Potchefstroom', -26.7145, 27.097], ['Brits', -25.6347, 27.7802]]],
    ['KwaZulu-Natal', -29.6006, 30.3794, [['Pietermaritzburg', -29.6006, 30.3794], ['Howick', -29.4779, 30.2306], ['Dundee', -28.1667, 30.2333]]],
  ]),

  SN: expand('Region', 'Department / Town', [
    ['Kaolack', 14.1652, -16.0758, [['Kaolack', 14.1652, -16.0758], ['Nioro du Rip', 13.75, -15.8], ['Guinguinéo', 14.2667, -15.95]]],
    ['Thiès', 14.791, -16.9359, [['Thiès', 14.791, -16.9359], ['Tivaouane (Niayes)', 14.95, -16.8167], ['Mbour', 14.4167, -16.9667]]],
    ['Saint-Louis', 16.0326, -16.4818, [['Richard-Toll', 16.4625, -15.7008], ['Dagana', 16.5167, -15.5], ['Podor', 16.6519, -14.9587]]],
    ['Fatick', 14.339, -16.4111, [['Fatick', 14.339, -16.4111], ['Foundiougne', 14.1333, -16.4667], ['Gossas', 14.4906, -16.0672]]],
    ['Ziguinchor (Casamance)', 12.5681, -16.2719, [['Ziguinchor', 12.5681, -16.2719], ['Bignona', 12.8103, -16.2264], ['Oussouye', 12.485, -16.5469]]],
  ]),
};

export function getCountryHierarchy(countryCode: string): CountryAdminHierarchy {
  return (
    COUNTRY_LOCATIONS[countryCode] ?? {
      stateLabel: 'State / Region',
      localityLabel: 'City / Area',
      states: [],
    }
  );
}
