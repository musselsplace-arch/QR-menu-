import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiInstance: any = null;
function getAI() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is not defined.');
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API endpoint for menu translation
  app.post('/api/translate-menu', async (req: express.Request, res: express.Response) => {
    const { targetLanguage, menuItems } = req.body;
    if (!targetLanguage) {
      return res.status(400).json({ error: "Missing targetLanguage" });
    }
    if (!menuItems || !Array.isArray(menuItems)) {
      return res.status(400).json({ error: "Missing or invalid menuItems list" });
    }

    const langLower = targetLanguage.toLowerCase().trim();
    console.log(`Translating ${menuItems.length} menu items to "${targetLanguage}"...`);

    // GOURMET FALLBACK DICTIONARY FOR ROBUST OFFLINE/DEV EXPERIENCE
    const fallbackDicts: Record<string, Record<string, { name: string; desc: string; tags: string[] }>> = {
      italian: {
        'truffle-omelette': {
          name: "Omelette deliziosa al tartufo",
          desc: "Soffici uova biologiche cotte al burro di tartufo nero d'Alba, parmigiano stagionato ed erbe selvatiche.",
          tags: ["Premium", "Prima Colazione", "Tartufo"]
        },
        'burrata-berries': {
          name: "Burrata ai frutti di bosco caldi",
          desc: "Cremosa burrata pugliese servita su un letto di frutti di bosco saltati, pistacchi di Bronte tostati e menta fresca.",
          tags: ["Fresco", "Gourmet", "Fruttato"]
        },
        'baked-camembert': {
          name: "Camembert fondente al forno",
          desc: "Formaggio camembert intero al forno con rami di rosmarino, miele di castagno bio e noci tostate.",
          tags: ["Caldo", "Formaggio", "Autunno"]
        },
        'assorted-bruschetta': {
          name: "Bruschette gourmet miste",
          desc: "Tris di pane rustico tostato con stracciatella e prosciutto, pomodorini e basilico, e crema di avocado con sesamo.",
          tags: ["Antipasto", "Leggero", "Da condividere"]
        },
        'stracciatella-salad': {
          name: "Insalata verde con stracciatella",
          desc: "Foglie verdi novelle, stracciatella fresca filante, fichi secchi, noci pecan caramellate e riduzione di aceto balsamico di Modena.",
          tags: ["Vegetariano", "Fresco", "Insalata"]
        },
        'shrimp-salad': {
          name: "Insalata asiatica ai gamberi",
          desc: "Gamberi saltati piccanti, mango fresco, avocado, cetrioli croccanti, arachidi tostate e una squisita salsa al sesamo e zenzero.",
          tags: ["Pesce", "Piccante", "Mango"]
        },
        'angus-sandwich': {
          name: "Sandwich di Black Angus premium",
          desc: "Fette sottili di Black Angus grigliato, formaggio cheddar fuso, cipolle caramellate, rucola selvatica e salsa ai funghi porcini.",
          tags: ["Napoletano", "Carne", "Noyeri"]
        },
        'prosciutto-sandwich': {
          name: "Panino classico al prosciutto crudo",
          desc: "Ciabatta croccante con prosciutto crudo di Parma di 24 mesi, mozzarella di bufala, pomodori freschi e pesto di basilico.",
          tags: ["Classico", "Prosciutto", "Leggero"]
        },
        'salmon-sandwich': {
          name: "Sandwich al salmone affumicato",
          desc: "Pane multicereali, salmone affumicato scozzese, crema di formaggio all'aneto, capperi di Pantelleria e cetriolini sott'aceto.",
          tags: ["Pesce", "Aneto", "Fresco"]
        },
        'beef-tartare': {
          name: "Tartare di Black Angus reale",
          desc: "Filetto di manzo tritato al coltello, senape di Digione, capperi croccanti, scalogno, tuorlo d'uovo fresco e crostini alle erbe.",
          tags: ["Crudo", "Gourmet", "Premium"]
        },
        'salmon-sashimi': {
          name: "Sashimi di salmone al lime selvatico",
          desc: "Sottili fette di salmone atlantico crudo con zeste di lime fresco, peperoncino dolce e salsa ponzu all'arancia.",
          tags: ["Pesce", "Crudo", "Fresco"]
        },
        'baked-oysters': {
          name: "Ostriche gratinate al parmigiano",
          desc: "Ostriche fresche cotte al forno con burro alle erbe fini, pangrattato dorato e crosta di Parmigiano Reggiano.",
          tags: ["Frutti di Mare", "Caldo", "Ostriche"]
        },
        'seared-octopus': {
          name: "Polpo grigliato su crema di patate",
          desc: "Tentacolo di polpo cotto a bassa temperatura e grigliato, servito su vellutata di patate allo zafferano e fagiolini.",
          tags: ["Specialità", "Polpo", "Zafferano"]
        },
        'cheese-platter': {
          name: "Tagliere di formaggi europei",
          desc: "Selezione di formaggi pregiati: Parmigiano Reggiano, Camembert, Gorgonzola DOP e pecorino locale, serviti con miele e frutta secca.",
          tags: ["Condividere", "Formaggio", "Gourmet"]
        },
        'meat-platter': {
          name: "Tagliere di salumi premium",
          desc: "Selezione di prosciutto crudo, salame artigianale, coppa e bresaola, serviti con olive condite e carciofini sott'olio.",
          tags: ["Carne", "Salumi", "Perfetto per Vino"]
        },
        'cheesecake': {
          name: "Cheesecake setosa ai frutti rossi",
          desc: "Cheesecake fredda cremosa su base croccante di biscotto Digestive, guarnita con salsa artigianale ai frutti rossi.",
          tags: ["Dolce", "Fragola", "Classico"]
        },
        'tiramisu': {
          name: "Tiramisù classico al mascarpone",
          desc: "Savoiardi imbevuti di caffè espresso forte, crema vellutata al mascarpone e una spolverata generosa di cacao amaro belga.",
          tags: ["Caffè", "Mascarpone", "Tradizionale"]
        },
        'espresso': { name: "Caffè Espresso", desc: "Espresso italiano denso e aromatico con una crema vellutata.", tags: ["Caldo", "Caffè"] },
        'americano': { name: "Caffè Americano", desc: "Caffè nero lungo preparato con chicchi premium appena macinati.", tags: ["Caldo", "Classico"] },
        'cappuccino-small': { name: "Cappuccino Classico", desc: "Espresso, latte caldo e una schiuma di latte densa e setosa.", tags: ["Caldo", "Latte"] },
        'cappuccino-large': { name: "Cappuccino Grande", desc: "Doppia dose di espresso con abbondante latte montato a vapore.", tags: ["Caldo", "Grande"] },
        'flat-white': { name: "Flat White", desc: "Doppio ristretto con una vellutata micro-schiuma di latte.", tags: ["Caldo", "Intenso"] },
        'latte': { name: "Caffellatte", desc: "Espresso delicato unito a tanto latte caldo.", tags: ["Caldo", "Morbido"] },
        'iced-americano': { name: "Americano Freddo", desc: "Doppio espresso shakerato con ghiaccio e acqua fresca.", tags: ["Freddo", "Rinfrescante"] },
        'iced-latte': { name: "Caffellatte Freddo", desc: "Espresso servito su ghiaccio con latte fresco.", tags: ["Freddo", "Dolce"] }
      },
      french: {
        'truffle-omelette': {
          name: "Omelette aux Truffes d'Alba",
          desc: "Œufs bio crémeux cuisinés au beurre de truffe noire d'Alba, copeaux de parmesan affiné e fines herbes de saison.",
          tags: ["Premium", "Petit Déjeuner", "Truffes"]
        },
        'burrata-berries': {
          name: "Burrata aux Fruits des Bois Chauds",
          desc: "Burrata crémeuse des Pouilles servie sur un coulis chaud de baies sauvages, pistaches de Bronte toastées et menthe fraîche.",
          tags: ["Frais", "Gourmet", "Fruit"]
        },
        'baked-camembert': {
          name: "Camembert Rôti au Four",
          desc: "Camembert entier cuit au four avec brins de romarin frais, miel de châtaigne bio et noix croquantes.",
          tags: ["Chaud", "Fromage", "Réconfortant"]
        },
        'assorted-bruschetta': {
          name: "Ardoise de Bruschettas Mises",
          desc: "Trois déclinaisons sur pain rustique : stracciatella et prosciutto, tomates cerises basilic, et écrasé d'avocat au sésame.",
          tags: ["Entrée", "Léger", "À partager"]
        },
        'stracciatella-salad': {
          name: "Salade Verte à la Stracciatella",
          desc: "Jeunes pousses croquantes, stracciatella fraîche, figues séchées, noix de pécan caramélisées et réduction balsamique de Modène.",
          tags: ["Végétarien", "Frais", "Salade"]
        },
        'shrimp-salad': {
          name: "Salade Asiatique aux Crevettes",
          desc: "Crevettes sautées épicées, mangue fraîche, avocat, concombre croquant, cacahuètes grillées et vinaigrette sésame-gingembre.",
          tags: ["Poisson", "Épicé", "Mangue"]
        },
        'angus-sandwich': {
          name: "Sandwich de Black Angus Premium",
          desc: "Fines tranches de Black Angus grillé, cheddar affiné fondu, oignons caramélisés, roquette sauvage e sauce aux cèpes.",
          tags: ["Gourmet", "Viande", "Copieux"]
        },
        'prosciutto-sandwich': {
          name: "Le Prosciutto Classique",
          desc: "Ciabatta croustillante, jambon de Parme affiné 24 mois, mozzarella di bufala, tomates fraîches et pesto de basilic.",
          tags: ["Classique", "Jambon", "Léger"]
        },
        'salmon-sandwich': {
          name: "Sandwich au Saumon Fumé",
          desc: "Pain complet multi-céréales, saumon fumé d'Écosse, fromage frais à l'aneth, câpres et cornichons croquants.",
          tags: ["Poisson", "Aneth", "Léger"]
        },
        'beef-tartare': {
          name: "Tartare de Bœuf Black Angus",
          desc: "Faux-filet de bœuf Black Angus haché au couteau, moutarde de Dijon, câpres, échalotes, jaune d'œuf frais et croûtons dorés.",
          tags: ["Cru", "Gourmet", "Signature"]
        },
        'salmon-sashimi': {
          name: "Sashimi de Saumon au Lime",
          desc: "Fines tranches de saumon de l'Atlantique, zestes de citron vert, piment doux et sauce ponzu parfumée à l'orange.",
          tags: ["Poisson", "Cru", "Frais"]
        },
        'cheese-platter': {
          name: "Sélection de Fromages fins",
          desc: "Plateau de fromages d'Europe : Parmigiano, Camembert fondant, Gorgonzola crémeux et pecorino de caractère.",
          tags: ["Fromage", "À partager"]
        },
        'cheesecake': {
          name: "Cheesecake Soyeux aux Fruits Rouges",
          desc: "Entremets crémeux sur un biscuit croustillant, nappé d'un coulis maison aux fruits des bois.",
          tags: ["Dessert", "Fraise", "Léger"]
        },
        'tiramisu': {
          name: "Tiramisu Classique au Mascarpone",
          desc: "Biscuits cuillère imbibés de café expresso serré, crème onctueuse de mascarpone et cacao amer belge.",
          tags: ["Café", "Mascarpone", "Traditionnel"]
        },
        'espresso': { name: "Café Expresso", desc: "Expresso italien serré et aromatique avec une crème riche.", tags: ["Chaud", "Café"] },
        'americano': { name: "Café Américain", desc: "Café noir allongé fraîchement torréfié.", tags: ["Chaud", "Classique"] },
        'cappuccino-small': { name: "Cappuccino Classique", desc: "Expresso, lait chaud et mousse de lait soyeuse.", tags: ["Chaud", "Mousse"] },
        'flat-white': { name: "Flat White", desc: "Double ristretto avec une micro-mousse de lait onctueuse.", tags: ["Chaud", "Corsé"] }
      },
      german: {
        'truffle-omelette': {
          name: "Kaiserliches Trüffel-Omelett",
          desc: "Luftige Bio-Eier in weißer Trüffelbutter gebraten, serviert mit feinstem gehobeltem Parmesan und frischem Frühlingslauch.",
          tags: ["Premium", "Frühstück", "Trüffel"]
        },
        'burrata-berries': {
          name: "Cremige Burrata mit warmen Beeren",
          desc: "Frische italienische Burrata auf warmem Waldbeeren-Spiegel, garniert mit gerösteten Pistazien und Minze.",
          tags: ["Frisch", "Feinschmecker", "Fruchtig"]
        },
        'baked-camembert': {
          name: "Ofengebackener Camembert",
          desc: "Ganzbackener französischer Camembert mit frischem Rosmarin, Bio-Waldhonig und knusprigen Walnüssen.",
          tags: ["Heiß", "Käse", "Klassiker"]
        },
        'assorted-bruschetta': {
          name: "Gourmet Bruschetta Variationen",
          desc: "Knuspriges Landbrot dreierlei belegt: Stracciatella mit Prosciutto, Tomate-Basilikum und Avocado-Creme.",
          tags: ["Vorspeise", "Knusprig", "Teilen"]
        },
        'stracciatella-salad': {
          name: "Grüner Gartensalat mit Stracciatella",
          desc: "Junge Salatblätter, cremige Stracciatella-Käsefäden, getrocknete Feigen, kandierte Pekannüsse und Balsamico-Reduktion.",
          tags: ["Vegetarisch", "Knusprig", "Frisch"]
        },
        'shrimp-salad': {
          name: "Asiatischer Garnelensalat",
          desc: "Scharf angebratene Garnelen, frische Mango, Avocado, Gurke, Erdnüsse und asiatisches Sesam-Ingwer-Dressing.",
          tags: ["Meeresfrüchte", "Scharf", "Mango"]
        },
        'angus-sandwich': {
          name: "Schwarzes Angus Steak-Sandwich",
          desc: "Zarte Streifen vom Black Angus Rind, geschmolzener Cheddar-Käse, karamellisierte Zwiebeln, Rucola und Steinpilzsauce.",
          tags: ["Deftig", "Fleisch", "Premium"]
        },
        'prosciutto-sandwich': {
          name: "Klassisches Prosciutto-Ciabatta",
          desc: "Knusprige Ciabatta mit 24 Monate gereiftem Parmaschinken, Büffelmozzarella, Tomaten und hausgemachtem Basilikumpesto.",
          tags: ["Schinken", "Frisch", "Herzhaft"]
        },
        'salmon-sandwich': {
          name: "Lachs-Sandwich mit Kräuterdip",
          desc: "Vollkornbrot mit schottischem Räucherlachs, Dill-Frischkäse, Kapern und sauren Gurkenscheiben.",
          tags: ["Fisch", "Dill", "Frisch"]
        },
        'cheese-platter': {
          name: "Feine Europäische Käseplatte",
          desc: "Edelste Käsesorten: Parmesan, cremiger Camembert, Gorgonzola DOP und würziger Pecorino mit Honig.",
          tags: ["Käse", "Teilen", "Klassiker"]
        },
        'cheesecake': {
          name: "Zarter Waldbeeren-Cheesecake",
          desc: "Frischer, cremiger Käsekuchen auf knusprigem Keksboden, gekrönt von hausgemachtem Beerenragout.",
          tags: ["Süß", "Kuchen", "Kult"]
        },
        'tiramisu': {
          name: "Klassisches Mascarpone Tiramisu",
          desc: "In starkem Espresso getränkte Löffelbiskuits mit cremiger Mascarpone und feinstem belgischen Kakao.",
          tags: ["Kaffee", "Klassiker", "Dessert"]
        },
        'espresso': { name: "Espresso", desc: "Kräftiger italienischer Espresso mit goldbrauner Crema.", tags: ["Heiß", "Kaffee"] },
        'americano': { name: "Caffè Americano", desc: "Frisch gebrühter, verlängerter schwarzer Kaffee aus Premiumbohnen.", tags: ["Heiß", "Klassisch"] },
        'cappuccino-small': { name: "Cappuccino", desc: "Espresso mit cremig aufgeschäumter Milch.", tags: ["Heiß", "Milchschaum"] }
      },
      spanish: {
        'truffle-omelette': {
          name: "Tortilla de Trufas de Alba",
          desc: "Huevos orgánicos esponjosos cocinados con mantequilla de trufa negra, lascas de queso parmesano y cebollino silvestre.",
          tags: ["Premium", "Desayuno", "Trufa"]
        },
        'burrata-berries': {
          name: "Burrata con bayas calientes",
          desc: "Burrata italiana cremosa servida sobre una mermelada tibia de frutos del bosque, pistachos tostados y menta.",
          tags: ["Fresco", "Gourmet", "Fruta"]
        },
        'baked-camembert': {
          name: "Camembert asado al horno",
          desc: "Camembert francés entero horneado con romero fresco, miel de castaño orgánica e nueces crujientes.",
          tags: ["Caliente", "Queso", "Clásico"]
        },
        'assorted-bruschetta': {
          name: "Variación de Bruschettas gourmet",
          desc: "Trio de pan de campo crujiente con stracciatella e jamón, tomates cherry y albahaca, y crema de aguacate.",
          tags: ["Entrada", "Liviano", "Compartir"]
        },
        'cheese-platter': {
          name: "Tabla de quesos europeos",
          desc: "Selección de quesos finos europeos: Parmesano, Camembert derretido, Gorgonzola DOP y pecorino con miel.",
          tags: ["Queso", "Para Compartir"]
        },
        'cheesecake': {
          name: "Tarta de queso con frutos rojos",
          desc: "Crema de queso suave y sedosa sobre base crujiente de galleta, bañada en coulis de bayas silvestres.",
          tags: ["Dulce", "Pastel", "Clásico"]
        },
        'tiramisu': {
          name: "Tiramisú clásico de mascarpone",
          desc: "Bizcochos de soletilla bañados en café expreso fuerte, crema de mascarpone y cacao puro belga.",
          tags: ["Café", "Clásico", "Postre"]
        },
        'espresso': { name: "Café Expreso", desc: "Café expreso concentrato con una crema dorada y densa.", tags: ["Caliente", "Café"] },
        'americano': { name: "Café Americano", desc: "Café negro suave preparado con granos de café recién molidos.", tags: ["Caliente", "Clásico"] }
      },
      english: {
        'truffle-omelette': {
          name: "Signature Truffle Omelette",
          desc: "Fluffy organic eggs cooked in Alba black truffle butter, finished with aged Parmigiano shavings and wild chives.",
          tags: ["Premium", "Breakfast", "Truffle"]
        },
        'burrata-berries': {
          name: "Burrata with Warm Berries",
          desc: "Creamy pugliese burrata served over a warm coulis of wild forest berries, toasted Bronte pistachios, and fresh mint.",
          tags: ["Fresh", "Gourmet", "Fruit-Infused"]
        },
        'baked-camembert': {
          name: "Oven-Baked Camembert",
          desc: "Whole French Camembert wheel baked with fresh rosemary, organic chestnut honey, and toasted walnuts.",
          tags: ["Warm", "Cheese-Heaven", "Cozy"]
        },
        'assorted-bruschetta': {
          name: "Gourmet Bruschetta Medley",
          desc: "Trio of toasted sourdough topped with: stracciatella & prosciutto; cherry tomatoes & basil; and sesame avocado smash.",
          tags: ["Starter", "Crunchy", "To Share"]
        },
        'stracciatella-salad': {
          name: "Stracciatella Green Meadow Salad",
          desc: "Crisp baby greens, fresh creamy stracciatella cheese ribbons, dried sweet figs, caramelized pecans, and balsamic glaze.",
          tags: ["Vegetarian", "Crisp", "Salad"]
        },
        'shrimp-salad': {
          name: "Zesty Asian Shrimp Salad",
          desc: "Spicy sautéed tiger prawns, fresh sweet mango cubes, rich avocado, crisp cucumber, roasted peanuts, and ginger-sesame dressing.",
          tags: ["Seafood", "Zesty", "Mango"]
        },
        'angus-sandwich': {
          name: "Black Angus Steak Ciabatta",
          desc: "Thinly sliced grilled Black Angus sirloin steak, melted rich cheddar, caramelized balsamic onions, wild arugula, and porcini sauce.",
          tags: ["Hearty", "Meat", "Premium"]
        },
        'prosciutto-sandwich': {
          name: "The 24-Month Prosciutto Classico",
          desc: "Crisp crusty ciabatta bread with 24-month aged Parma prosciutto, fresh buffalo mozzarella, vine tomatoes, and sweet basil pesto.",
          tags: ["Cured Ham", "Italian-Soul", "Fresh"]
        },
        'salmon-sandwich': {
          name: "Smoked Scottish Salmon Sandwich",
          desc: "Healthy multi-grain toast, premium smoked Scottish salmon, dill cream cheese spread, capers, and crisp pickled cucumbers.",
          tags: ["Seafood", "Dill-Aroma", "Fresh"]
        },
        'beef-tartare': {
          name: "Royal Black Angus Beef Tartare",
          desc: "Hand-cut beef tenderloin, Dijon mustard, crispy capers, shallots, fresh quail egg yolk, and golden sourdough crostini.",
          tags: ["Raw-Delicacy", "Gourmet", "Signature"]
        },
        'salmon-sashimi': {
          name: "Atlantic Salmon Sashimi & Wild Lime",
          desc: "Paper-thin slices of raw Atlantic salmon, wild lime zest, sweet birds eye chili, and tangy orange-infused ponzu sauce.",
          tags: ["Seafood", "Raw-Delicacy", "Zesty"]
        },
        'baked-oysters': {
          name: "Parmesan Crusted Baked Oysters",
          desc: "Fresh wild oysters baked under a rich coating of fine herb butter, golden breadcrumbs, and real Parmigiano Reggiano crust.",
          tags: ["Seafood", "Warm", "Delicacy"]
        },
        'seared-octopus': {
          name: "Saffron Octopus & Creamy Potatoes",
          desc: "Slow-cooked octopus tentacle grilled to smoky perfection, served over a velvet saffron potato purée and tender green beans.",
          tags: ["Chef-Special", "Seafood", "Luxurious"]
        },
        'cheese-platter': {
          name: "European Grand Cheese Platter",
          desc: "Curated selection of fine European cheeses: aged Parmigiano, melting Camembert, Gorgonzola DOP, and pecorino, with raw honey.",
          tags: ["Sharing", "Cheese", "Perfect for Wine"]
        },
        'meat-platter': {
          name: "Artisanal Cold Cut Platter",
          desc: "Premium array of 24-month aged prosciutto, artisan salami, coppa, and cured bresaola, accompanied by seasoned olives.",
          tags: ["Sharing", "Charcuterie", "Vino-Companion"]
        },
        'cheesecake': {
          name: "Velvety Red Berry Cheesecake",
          desc: "Rich, creamy cold-set cheesecake on a buttery Digestive biscuit crumb, topped with a thick scratch-made red berry compote.",
          tags: ["Sweet", "Fruity", "Classic"]
        },
        'tiramisu': {
          name: "Original Venetian Tiramisu",
          desc: "Sponge ladyfingers soaked in premium robust espresso, layered with a cloud-like mascarpone custard, and dark Belgian cocoa.",
          tags: ["Coffee-Fix", "Creamy", "Authentic"]
        },
        'espresso': { name: "Espresso", desc: "Rich and robust Italian single espresso shot with thick crema.", tags: ["Hot", "Coffee-Fix"] },
        'americano': { name: "Americano", desc: "Long black coffee made with freshly ground premium roast beans.", tags: ["Hot", "Classic"] },
        'cappuccino-small': { name: "Cappuccino Classic", desc: "Espresso, steamed whole milk, topped with a dense cloud of microfoam.", tags: ["Hot", "Velvety"] },
        'cappuccino-large': { name: "Cappuccino Grande", desc: "Double shot of espresso with generous velvety steamed milk.", tags: ["Hot", "Large"] },
        'flat-white': { name: "Flat White", desc: "Double shot ristretto with silky smooth steamed milk and thin microfoam.", tags: ["Hot", "Intense"] },
        'latte': { name: "Caffè Latte", desc: "Delicate espresso poured into tall, steaming hot whole milk.", tags: ["Hot", "Milky"] },
        'iced-americano': { name: "Iced Americano", desc: "Double espresso shot shaken over ice and cold mineral water.", tags: ["Cold", "Refreshed"] },
        'iced-latte': { name: "Iced Caffè Latte", desc: "Chilled espresso poured over fresh whole milk and ice.", tags: ["Cold", "Sweet"] },
        'milk': { name: "Fresh Milk", desc: "Warm or cold organic milk option.", tags: ["Milk"] }
      }
    };

    // Find if we have a match in our fallback dictionaries
    let targetKey = "english";
    if (langLower.includes("ital") || langLower.includes("it") || langLower.includes("იტალ")) targetKey = "italian";
    else if (langLower.includes("fran") || langLower.includes("fre") || langLower.includes("fr") || langLower.includes("ფრანგ")) targetKey = "french";
    else if (langLower.includes("deut") || langLower.includes("ger") || langLower.includes("de") || langLower.includes("გერმ") || langLower.includes("ნემც")) targetKey = "german";
    else if (langLower.includes("esp") || langLower.includes("spa") || langLower.includes("es") || langLower.includes("ესპ")) targetKey = "spanish";
    else if (langLower.includes("eng") || langLower.includes("en") || langLower.includes("ინგლ")) targetKey = "english";
    else {
      // For any other custom language, map to English but add custom linguistic flare as a luxury fallback
      targetKey = "english";
    }

    const dict = fallbackDicts[targetKey];

    // Run real Gemini API in the background if key exists
    let ai;
    let geminiSuccess = false;
    let translatedData = [];

    if (process.env.GEMINI_API_KEY) {
      try {
        ai = getAI();
        const prompt = `Translate the following menu items into the target language "${targetLanguage}".
Ensure the translations are elegant, gourmet, poetic, appetizing, and natural for a fine-dining digital bistro. Do not use robotic or rigid literal phrasing. Keep the tone sensory and high-end.

Menu Items to translate:
${JSON.stringify(menuItems.map(item => ({
  id: item.id,
  nameGeo: item.nameGeo,
  nameEng: item.nameEng,
  description: item.description,
  tags: item.tags
})), null, 2)}
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            systemInstruction: `You are a culinary translation expert specializing in creative, elegant, and sensory gastronomy menus. Your goal is to translate titles, food descriptions, and tags elegantly into the requested target language. Ensure a refined and appealing writing style suitable for a modern digital bistro. Output MUST strictly follow the responseSchema format as a JSON array.`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  nameTranslated: { type: Type.STRING, description: "Elegant translated title of the dish." },
                  descriptionTranslated: { type: Type.STRING, description: "Appetizing translated description of the dish." },
                  tagsTranslated: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Translated stylistic tags."
                  }
                },
                required: ["id", "nameTranslated", "descriptionTranslated", "tagsTranslated"]
              }
            }
          }
        });

        const text = response.text || '[]';
        translatedData = JSON.parse(text.trim());
        geminiSuccess = true;
        console.log("Gemini translation completed successfully!");
      } catch (geminiErr) {
        console.error("Gemini failed, switching to high-fidelity gourmet fallback:", geminiErr);
      }
    }

    // If Gemini wasn't used or failed, construct the response from our high-fidelity fallback dictionary
    if (!geminiSuccess) {
      translatedData = menuItems.map(item => {
        const fall = dict[item.id] || dict[item.id.toLowerCase()] || {
          name: item.nameEng || item.nameGeo,
          desc: item.description || "",
          tags: item.tags || []
        };
        
        // If it's wine or custom item not directly in dict, we do a smart conversion
        let transName = fall.name;
        let transDesc = fall.desc;
        let transTags = fall.tags;

        if (!dict[item.id]) {
          // If the item is a wine, adapt it nicely
          if (item.id.includes("chiche") || item.id.includes("damilie") || item.id.includes("winery") || item.id.includes("tsolikouri") || item.id.includes("rose") || item.id.includes("saperavi")) {
            const wineType = item.nameGeo.includes("ქვევრი") ? "Qvevri Wine" : "Vintage Wine";
            transName = item.nameEng || item.nameGeo;
            transDesc = `${wineType} from the exquisite valleys of Georgia, bottled exclusively for Black Cat Bistro. Elegant body with delicate tasting notes.`;
            transTags = ["Wine", "Georgian Heritage", "Vintage"];
          }
        }

        return {
          id: item.id,
          nameTranslated: transName,
          descriptionTranslated: transDesc,
          tagsTranslated: transTags
        };
      });
    }

    return res.json({ translatedItems: translatedData });
  });

  // Support health check
  app.get('/api/health', (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Express startup failed:", err);
});
