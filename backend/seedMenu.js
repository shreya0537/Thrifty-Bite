require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const mongoose = require("mongoose");
const Menu = require("./models/menu");
const User = require("./models/user");
const { slugify } = require("./utils/foodIcon");

const menuData = [

    // =====================================================
    // BIRYANI — 25
    // =====================================================

    {
        name: "Royal Chicken Biryani",
        description: "Fragrant basmati rice layered with tender chicken and royal spices.",
        category: "Biryani",
        price: 280,
        discountPrice: 219,
        rating: 4.8,
        reviewCount: 342,
        isVeg: false,
        tags: ["chicken", "spicy", "bestseller"]
    },
    {
        name: "Hyderabadi Chicken Biryani",
        description: "Classic Hyderabadi dum biryani with aromatic spices and tender chicken.",
        category: "Biryani",
        price: 300,
        discountPrice: 239,
        rating: 4.7,
        reviewCount: 287,
        isVeg: false,
        tags: ["hyderabadi", "chicken", "dum"]
    },
    {
        name: "Mutton Dum Biryani",
        description: "Slow-cooked mutton with fragrant basmati rice and traditional spices.",
        category: "Biryani",
        price: 360,
        discountPrice: 289,
        rating: 4.8,
        reviewCount: 214,
        isVeg: false,
        tags: ["mutton", "dum", "premium"]
    },
    {
        name: "Lucknowi Mutton Biryani",
        description: "Delicate Lucknow-style biryani prepared with tender mutton and aromatic rice.",
        category: "Biryani",
        price: 370,
        discountPrice: 299,
        rating: 4.7,
        reviewCount: 156,
        isVeg: false,
        tags: ["lucknowi", "mutton", "premium"]
    },
    {
        name: "Egg Biryani",
        description: "Aromatic basmati rice served with spiced boiled eggs.",
        category: "Biryani",
        price: 210,
        discountPrice: 159,
        rating: 4.5,
        reviewCount: 198,
        isVeg: false,
        tags: ["egg", "value"]
    },
    {
        name: "Paneer Biryani",
        description: "Fluffy basmati rice layered with marinated paneer and royal spices.",
        category: "Biryani",
        price: 240,
        discountPrice: 189,
        rating: 4.6,
        reviewCount: 176,
        isVeg: true,
        tags: ["paneer", "veg", "spicy"]
    },
    {
        name: "Veg Dum Biryani",
        description: "Basmati rice cooked with seasonal vegetables and aromatic spices.",
        category: "Biryani",
        price: 220,
        discountPrice: 169,
        rating: 4.5,
        reviewCount: 231,
        isVeg: true,
        tags: ["veg", "dum", "healthy"]
    },
    {
        name: "Mushroom Biryani",
        description: "Tender mushrooms cooked with basmati rice and fragrant spices.",
        category: "Biryani",
        price: 230,
        discountPrice: 179,
        rating: 4.5,
        reviewCount: 143,
        isVeg: true,
        tags: ["mushroom", "veg"]
    },
    {
        name: "Chicken Tikka Biryani",
        description: "Smoky chicken tikka combined with fragrant dum-cooked rice.",
        category: "Biryani",
        price: 310,
        discountPrice: 249,
        rating: 4.8,
        reviewCount: 267,
        isVeg: false,
        tags: ["chicken", "tikka", "smoky"]
    },
    {
        name: "Chicken 65 Biryani",
        description: "Spicy Chicken 65 pieces served with aromatic biryani rice.",
        category: "Biryani",
        price: 320,
        discountPrice: 259,
        rating: 4.7,
        reviewCount: 198,
        isVeg: false,
        tags: ["chicken65", "spicy"]
    },
    {
        name: "Andhra Chicken Biryani",
        description: "Fiery Andhra-style chicken biryani packed with bold spices.",
        category: "Biryani",
        price: 290,
        discountPrice: 229,
        rating: 4.6,
        reviewCount: 165,
        isVeg: false,
        tags: ["andhra", "chicken", "spicy"]
    },
    {
        name: "Malabar Chicken Biryani",
        description: "Kerala-inspired biryani with fragrant rice and spiced chicken.",
        category: "Biryani",
        price: 300,
        discountPrice: 239,
        rating: 4.7,
        reviewCount: 152,
        isVeg: false,
        tags: ["malabar", "chicken"]
    },
    {
        name: "Kolkata Chicken Biryani",
        description: "Lightly spiced Kolkata-style biryani with chicken and potato.",
        category: "Biryani",
        price: 280,
        discountPrice: 219,
        rating: 4.6,
        reviewCount: 137,
        isVeg: false,
        tags: ["kolkata", "chicken", "potato"]
    },
    {
        name: "Kolkata Mutton Biryani",
        description: "Aromatic Kolkata biryani with tender mutton and traditional potato.",
        category: "Biryani",
        price: 350,
        discountPrice: 279,
        rating: 4.7,
        reviewCount: 129,
        isVeg: false,
        tags: ["kolkata", "mutton"]
    },
    {
        name: "Keema Biryani",
        description: "Flavourful minced meat layered with seasoned basmati rice.",
        category: "Biryani",
        price: 330,
        discountPrice: 269,
        rating: 4.6,
        reviewCount: 112,
        isVeg: false,
        tags: ["keema", "meat"]
    },
    {
        name: "Prawn Biryani",
        description: "Juicy prawns cooked with aromatic rice and coastal spices.",
        category: "Biryani",
        price: 390,
        discountPrice: 319,
        rating: 4.8,
        reviewCount: 96,
        isVeg: false,
        tags: ["prawn", "seafood", "premium"]
    },
    {
        name: "Fish Biryani",
        description: "Tender spiced fish paired with fragrant basmati biryani rice.",
        category: "Biryani",
        price: 360,
        discountPrice: 289,
        rating: 4.6,
        reviewCount: 87,
        isVeg: false,
        tags: ["fish", "seafood"]
    },
    {
        name: "Paneer Tikka Biryani",
        description: "Char-grilled paneer tikka layered with aromatic basmati rice.",
        category: "Biryani",
        price: 260,
        discountPrice: 199,
        rating: 4.7,
        reviewCount: 144,
        isVeg: true,
        tags: ["paneer", "tikka", "veg"]
    },
    {
        name: "Corn Biryani",
        description: "Sweet corn and aromatic basmati rice cooked with mild spices.",
        category: "Biryani",
        price: 210,
        discountPrice: 159,
        rating: 4.4,
        reviewCount: 78,
        isVeg: true,
        tags: ["corn", "veg"]
    },
    {
        name: "Soya Chaap Biryani",
        description: "Spiced soya chaap combined with fragrant dum-cooked rice.",
        category: "Biryani",
        price: 240,
        discountPrice: 189,
        rating: 4.5,
        reviewCount: 91,
        isVeg: true,
        tags: ["soya", "veg", "protein"]
    },
    {
        name: "Special Royal Biryani",
        description: "Signature biryani loaded with chicken, egg and aromatic spices.",
        category: "Biryani",
        price: 390,
        discountPrice: 319,
        rating: 4.9,
        reviewCount: 405,
        isVeg: false,
        tags: ["special", "royal", "bestseller"]
    },
    {
        name: "Mini Chicken Biryani",
        description: "Compact serving of aromatic chicken biryani for light appetites.",
        category: "Biryani",
        price: 190,
        discountPrice: 149,
        rating: 4.5,
        reviewCount: 188,
        isVeg: false,
        tags: ["chicken", "mini", "value"]
    },
    {
        name: "Family Chicken Biryani",
        description: "Generous family-sized chicken biryani perfect for sharing.",
        category: "Biryani",
        price: 720,
        discountPrice: 599,
        rating: 4.8,
        reviewCount: 221,
        isVeg: false,
        tags: ["family", "chicken", "value"]
    },
    {
        name: "Family Veg Biryani",
        description: "Large serving of vegetable dum biryani for the whole family.",
        category: "Biryani",
        price: 560,
        discountPrice: 449,
        rating: 4.6,
        reviewCount: 104,
        isVeg: true,
        tags: ["family", "veg"]
    },
    {
        name: "Royal Paneer Biryani",
        description: "Premium paneer biryani finished with saffron and aromatic herbs.",
        category: "Biryani",
        price: 290,
        discountPrice: 229,
        rating: 4.8,
        reviewCount: 119,
        isVeg: true,
        tags: ["paneer", "premium", "royal"]
    },


    // =====================================================
    // PIZZA — 20
    // =====================================================

    {
        name: "Margherita Pizza",
        description: "Classic pizza topped with tomato sauce, mozzarella and basil.",
        category: "Pizza",
        price: 220,
        discountPrice: 169,
        rating: 4.5,
        reviewCount: 321,
        isVeg: true,
        tags: ["classic", "cheese", "veg"]
    },
    {
        name: "Farmhouse Pizza",
        description: "Loaded with onion, capsicum, tomato, mushrooms and mozzarella.",
        category: "Pizza",
        price: 290,
        discountPrice: 219,
        rating: 4.7,
        reviewCount: 287,
        isVeg: true,
        tags: ["farmhouse", "veg", "bestseller"]
    },
    {
        name: "Paneer Tikka Pizza",
        description: "Spicy paneer tikka, onion and capsicum over melted cheese.",
        category: "Pizza",
        price: 310,
        discountPrice: 239,
        rating: 4.8,
        reviewCount: 242,
        isVeg: true,
        tags: ["paneer", "spicy", "veg"]
    },
    {
        name: "Cheese Burst Pizza",
        description: "Extra cheesy pizza with a rich molten cheese-filled crust.",
        category: "Pizza",
        price: 280,
        discountPrice: 219,
        rating: 4.6,
        reviewCount: 276,
        isVeg: true,
        tags: ["cheese", "bestseller"]
    },
    {
        name: "Chicken Pepperoni Pizza",
        description: "Cheesy pizza topped with spicy chicken pepperoni slices.",
        category: "Pizza",
        price: 350,
        discountPrice: 279,
        rating: 4.8,
        reviewCount: 198,
        isVeg: false,
        tags: ["chicken", "pepperoni"]
    },
    {
        name: "Chicken Tikka Pizza",
        description: "Smoky chicken tikka with onions, peppers and mozzarella.",
        category: "Pizza",
        price: 330,
        discountPrice: 259,
        rating: 4.7,
        reviewCount: 185,
        isVeg: false,
        tags: ["chicken", "tikka"]
    },
    {
        name: "BBQ Chicken Pizza",
        description: "Tender chicken with smoky barbecue sauce and melted cheese.",
        category: "Pizza",
        price: 340,
        discountPrice: 269,
        rating: 4.7,
        reviewCount: 164,
        isVeg: false,
        tags: ["chicken", "bbq"]
    },
    {
        name: "Mexican Green Wave Pizza",
        description: "Spicy Mexican-style pizza with jalapenos, peppers and onions.",
        category: "Pizza",
        price: 290,
        discountPrice: 219,
        rating: 4.6,
        reviewCount: 153,
        isVeg: true,
        tags: ["mexican", "spicy", "veg"]
    },
    {
        name: "Corn Cheese Pizza",
        description: "Sweet corn, mozzarella and creamy cheese sauce.",
        category: "Pizza",
        price: 250,
        discountPrice: 189,
        rating: 4.5,
        reviewCount: 121,
        isVeg: true,
        tags: ["corn", "cheese"]
    },
    {
        name: "Mushroom Truffle Pizza",
        description: "Mushrooms and creamy cheese finished with truffle-inspired seasoning.",
        category: "Pizza",
        price: 380,
        discountPrice: 299,
        rating: 4.8,
        reviewCount: 88,
        isVeg: true,
        tags: ["mushroom", "premium"]
    },
    {
        name: "Double Cheese Pizza",
        description: "A rich double layer of mozzarella and cheddar cheese.",
        category: "Pizza",
        price: 270,
        discountPrice: 209,
        rating: 4.6,
        reviewCount: 201,
        isVeg: true,
        tags: ["cheese", "bestseller"]
    },
    {
        name: "Spicy Chicken Pizza",
        description: "Hot chicken pieces with jalapenos, peppers and chilli sauce.",
        category: "Pizza",
        price: 330,
        discountPrice: 259,
        rating: 4.7,
        reviewCount: 143,
        isVeg: false,
        tags: ["chicken", "spicy"]
    },
    {
        name: "Tandoori Paneer Pizza",
        description: "Tandoori paneer with onions and capsicum on a cheesy base.",
        category: "Pizza",
        price: 320,
        discountPrice: 249,
        rating: 4.8,
        reviewCount: 177,
        isVeg: true,
        tags: ["paneer", "tandoori"]
    },
    {
        name: "Veggie Delight Pizza",
        description: "Fresh vegetables, herbs and mozzarella on a crispy pizza base.",
        category: "Pizza",
        price: 260,
        discountPrice: 199,
        rating: 4.5,
        reviewCount: 109,
        isVeg: true,
        tags: ["vegetable", "veg"]
    },
    {
        name: "Chicken Supreme Pizza",
        description: "Loaded chicken pizza with peppers, onions, olives and cheese.",
        category: "Pizza",
        price: 370,
        discountPrice: 289,
        rating: 4.8,
        reviewCount: 212,
        isVeg: false,
        tags: ["chicken", "supreme", "bestseller"]
    },
    {
        name: "Garden Fresh Pizza",
        description: "Colourful combination of fresh vegetables and herbs.",
        category: "Pizza",
        price: 240,
        discountPrice: 179,
        rating: 4.4,
        reviewCount: 93,
        isVeg: true,
        tags: ["fresh", "veg"]
    },
    {
        name: "Four Cheese Pizza",
        description: "Luxurious combination of four creamy cheeses.",
        category: "Pizza",
        price: 360,
        discountPrice: 289,
        rating: 4.8,
        reviewCount: 134,
        isVeg: true,
        tags: ["cheese", "premium"]
    },
    {
        name: "Chicken Sausage Pizza",
        description: "Cheesy pizza topped with savoury chicken sausage and peppers.",
        category: "Pizza",
        price: 320,
        discountPrice: 249,
        rating: 4.6,
        reviewCount: 117,
        isVeg: false,
        tags: ["chicken", "sausage"]
    },
    {
        name: "Indian Masala Pizza",
        description: "Fusion pizza with Indian spices, paneer, onion and capsicum.",
        category: "Pizza",
        price: 300,
        discountPrice: 229,
        rating: 4.7,
        reviewCount: 156,
        isVeg: true,
        tags: ["indian", "masala", "fusion"]
    },
    {
        name: "Royal Cheese Pizza",
        description: "Signature extra-cheesy pizza with herbs and a golden crust.",
        category: "Pizza",
        price: 340,
        discountPrice: 269,
        rating: 4.9,
        reviewCount: 198,
        isVeg: true,
        tags: ["royal", "cheese", "signature"]
    },


    // =====================================================
    // BURGERS — 20
    // =====================================================

    {
        name: "Classic Veg Burger",
        description: "Crispy vegetable patty with lettuce, tomato and creamy sauce.",
        category: "Burgers",
        price: 160,
        discountPrice: 119,
        rating: 4.4,
        reviewCount: 214,
        isVeg: true,
        tags: ["burger", "veg", "value"]
    },
    {
        name: "Classic Chicken Burger",
        description: "Juicy chicken patty with lettuce, tomato and signature sauce.",
        category: "Burgers",
        price: 190,
        discountPrice: 149,
        rating: 4.6,
        reviewCount: 286,
        isVeg: false,
        tags: ["chicken", "burger", "bestseller"]
    },
    {
        name: "Crispy Chicken Burger",
        description: "Crunchy fried chicken fillet with creamy mayo and lettuce.",
        category: "Burgers",
        price: 210,
        discountPrice: 159,
        rating: 4.7,
        reviewCount: 301,
        isVeg: false,
        tags: ["crispy", "chicken"]
    },
    {
        name: "Paneer Burger",
        description: "Grilled paneer patty with fresh vegetables and spicy sauce.",
        category: "Burgers",
        price: 190,
        discountPrice: 149,
        rating: 4.5,
        reviewCount: 164,
        isVeg: true,
        tags: ["paneer", "veg"]
    },
    {
        name: "Cheese Burger",
        description: "Classic burger layered with melted cheese and signature sauce.",
        category: "Burgers",
        price: 200,
        discountPrice: 159,
        rating: 4.6,
        reviewCount: 245,
        isVeg: true,
        tags: ["cheese", "burger"]
    },
    {
        name: "Double Cheese Burger",
        description: "Two cheese layers with a hearty vegetable patty.",
        category: "Burgers",
        price: 230,
        discountPrice: 179,
        rating: 4.7,
        reviewCount: 172,
        isVeg: true,
        tags: ["double", "cheese"]
    },
    {
        name: "Double Chicken Burger",
        description: "Two juicy chicken patties stacked with cheese and sauce.",
        category: "Burgers",
        price: 280,
        discountPrice: 219,
        rating: 4.8,
        reviewCount: 188,
        isVeg: false,
        tags: ["chicken", "double", "premium"]
    },
    {
        name: "Spicy Chicken Burger",
        description: "Fiery chicken patty with jalapenos and spicy chilli sauce.",
        category: "Burgers",
        price: 220,
        discountPrice: 169,
        rating: 4.6,
        reviewCount: 143,
        isVeg: false,
        tags: ["chicken", "spicy"]
    },
    {
        name: "BBQ Chicken Burger",
        description: "Grilled chicken patty with smoky barbecue sauce.",
        category: "Burgers",
        price: 230,
        discountPrice: 179,
        rating: 4.7,
        reviewCount: 132,
        isVeg: false,
        tags: ["chicken", "bbq"]
    },
    {
        name: "Mushroom Swiss Burger",
        description: "Juicy veg patty topped with mushrooms and creamy cheese.",
        category: "Burgers",
        price: 220,
        discountPrice: 169,
        rating: 4.5,
        reviewCount: 96,
        isVeg: true,
        tags: ["mushroom", "cheese"]
    },
    {
        name: "Aloo Tikki Burger",
        description: "Indian-style crispy potato patty with tangy sauces.",
        category: "Burgers",
        price: 130,
        discountPrice: 99,
        rating: 4.4,
        reviewCount: 267,
        isVeg: true,
        tags: ["aloo", "value", "veg"]
    },
    {
        name: "Corn & Cheese Burger",
        description: "Crispy corn and cheese patty with creamy dressing.",
        category: "Burgers",
        price: 170,
        discountPrice: 129,
        rating: 4.5,
        reviewCount: 102,
        isVeg: true,
        tags: ["corn", "cheese"]
    },
    {
        name: "Tandoori Chicken Burger",
        description: "Tandoori-spiced chicken patty with mint mayo.",
        category: "Burgers",
        price: 230,
        discountPrice: 179,
        rating: 4.7,
        reviewCount: 155,
        isVeg: false,
        tags: ["tandoori", "chicken"]
    },
    {
        name: "Peri Peri Chicken Burger",
        description: "Crispy chicken with fiery peri peri seasoning.",
        category: "Burgers",
        price: 230,
        discountPrice: 179,
        rating: 4.7,
        reviewCount: 129,
        isVeg: false,
        tags: ["peri-peri", "chicken"]
    },
    {
        name: "Royal Maharaja Burger",
        description: "Signature loaded burger with double patty, cheese and vegetables.",
        category: "Burgers",
        price: 300,
        discountPrice: 239,
        rating: 4.9,
        reviewCount: 231,
        isVeg: false,
        tags: ["royal", "loaded", "signature"]
    },
    {
        name: "Veg Supreme Burger",
        description: "Loaded vegetable patty with cheese, lettuce and premium sauces.",
        category: "Burgers",
        price: 210,
        discountPrice: 159,
        rating: 4.6,
        reviewCount: 117,
        isVeg: true,
        tags: ["veg", "supreme"]
    },
    {
        name: "Chicken Pepper Burger",
        description: "Pepper-seasoned chicken patty with cheese and onions.",
        category: "Burgers",
        price: 220,
        discountPrice: 169,
        rating: 4.5,
        reviewCount: 101,
        isVeg: false,
        tags: ["chicken", "pepper"]
    },
    {
        name: "Crispy Paneer Burger",
        description: "Crunchy paneer patty with lettuce and mint sauce.",
        category: "Burgers",
        price: 210,
        discountPrice: 159,
        rating: 4.6,
        reviewCount: 112,
        isVeg: true,
        tags: ["paneer", "crispy"]
    },
    {
        name: "Cheesy Chicken Burger",
        description: "Juicy chicken patty covered with melted cheese.",
        category: "Burgers",
        price: 240,
        discountPrice: 189,
        rating: 4.8,
        reviewCount: 141,
        isVeg: false,
        tags: ["chicken", "cheese"]
    },
    {
        name: "Royal Veggie Burger",
        description: "Premium vegetable patty with cheese and signature royal sauce.",
        category: "Burgers",
        price: 220,
        discountPrice: 169,
        rating: 4.7,
        reviewCount: 119,
        isVeg: true,
        tags: ["royal", "veg"]
    },


    // =====================================================
    // CHINESE — 20
    // =====================================================

    {
        name: "Veg Hakka Noodles",
        description: "Wok-tossed noodles with fresh vegetables and Asian sauces.",
        category: "Chinese",
        price: 190,
        discountPrice: 149,
        rating: 4.5,
        reviewCount: 231,
        isVeg: true,
        tags: ["noodles", "veg"]
    },
    {
        name: "Chicken Hakka Noodles",
        description: "Wok-tossed noodles with tender chicken and vegetables.",
        category: "Chinese",
        price: 230,
        discountPrice: 179,
        rating: 4.7,
        reviewCount: 248,
        isVeg: false,
        tags: ["noodles", "chicken"]
    },
    {
        name: "Schezwan Noodles",
        description: "Spicy noodles tossed in bold Schezwan sauce.",
        category: "Chinese",
        price: 210,
        discountPrice: 159,
        rating: 4.6,
        reviewCount: 184,
        isVeg: true,
        tags: ["schezwan", "spicy"]
    },
    {
        name: "Chicken Schezwan Noodles",
        description: "Spicy Schezwan noodles loaded with tender chicken.",
        category: "Chinese",
        price: 250,
        discountPrice: 199,
        rating: 4.7,
        reviewCount: 173,
        isVeg: false,
        tags: ["chicken", "schezwan"]
    },
    {
        name: "Veg Fried Rice",
        description: "Fragrant rice wok-fried with vegetables and soy sauce.",
        category: "Chinese",
        price: 180,
        discountPrice: 139,
        rating: 4.4,
        reviewCount: 221,
        isVeg: true,
        tags: ["fried rice", "veg"]
    },
    {
        name: "Chicken Fried Rice",
        description: "Wok-fried rice with chicken, vegetables and Asian seasonings.",
        category: "Chinese",
        price: 220,
        discountPrice: 169,
        rating: 4.6,
        reviewCount: 262,
        isVeg: false,
        tags: ["fried rice", "chicken"]
    },
    {
        name: "Schezwan Fried Rice",
        description: "Spicy fried rice tossed with Schezwan chilli sauce.",
        category: "Chinese",
        price: 200,
        discountPrice: 149,
        rating: 4.5,
        reviewCount: 146,
        isVeg: true,
        tags: ["fried rice", "spicy"]
    },
    {
        name: "Chicken Manchurian",
        description: "Crispy chicken pieces coated in tangy Manchurian sauce.",
        category: "Chinese",
        price: 260,
        discountPrice: 199,
        rating: 4.7,
        reviewCount: 198,
        isVeg: false,
        tags: ["chicken", "manchurian"]
    },
    {
        name: "Veg Manchurian",
        description: "Crispy vegetable balls in a rich Manchurian gravy.",
        category: "Chinese",
        price: 210,
        discountPrice: 159,
        rating: 4.5,
        reviewCount: 187,
        isVeg: true,
        tags: ["manchurian", "veg"]
    },
    {
        name: "Chilli Chicken",
        description: "Tender chicken tossed with peppers, onions and chilli sauce.",
        category: "Chinese",
        price: 270,
        discountPrice: 209,
        rating: 4.8,
        reviewCount: 215,
        isVeg: false,
        tags: ["chicken", "chilli", "bestseller"]
    },
    {
        name: "Chilli Paneer",
        description: "Crispy paneer tossed with peppers and spicy Asian sauce.",
        category: "Chinese",
        price: 240,
        discountPrice: 189,
        rating: 4.7,
        reviewCount: 176,
        isVeg: true,
        tags: ["paneer", "chilli"]
    },
    {
        name: "Gobi Manchurian",
        description: "Crispy cauliflower florets tossed in Manchurian sauce.",
        category: "Chinese",
        price: 200,
        discountPrice: 149,
        rating: 4.5,
        reviewCount: 165,
        isVeg: true,
        tags: ["gobi", "manchurian"]
    },
    {
        name: "Honey Chilli Potato",
        description: "Crispy potato fingers coated in sweet and spicy sauce.",
        category: "Chinese",
        price: 190,
        discountPrice: 139,
        rating: 4.6,
        reviewCount: 192,
        isVeg: true,
        tags: ["potato", "sweet-spicy"]
    },
    {
        name: "Dragon Chicken",
        description: "Crispy chicken tossed in fiery dragon sauce.",
        category: "Chinese",
        price: 290,
        discountPrice: 229,
        rating: 4.8,
        reviewCount: 143,
        isVeg: false,
        tags: ["chicken", "spicy"]
    },
    {
        name: "Veg Spring Rolls",
        description: "Crispy rolls filled with seasoned vegetables.",
        category: "Chinese",
        price: 170,
        discountPrice: 129,
        rating: 4.4,
        reviewCount: 131,
        isVeg: true,
        tags: ["spring rolls", "veg"]
    },
    {
        name: "Chicken Spring Rolls",
        description: "Crispy rolls stuffed with seasoned chicken and vegetables.",
        category: "Chinese",
        price: 210,
        discountPrice: 159,
        rating: 4.5,
        reviewCount: 109,
        isVeg: false,
        tags: ["spring rolls", "chicken"]
    },
    {
        name: "Veg Momos",
        description: "Steamed dumplings filled with seasoned vegetables.",
        category: "Chinese",
        price: 160,
        discountPrice: 119,
        rating: 4.5,
        reviewCount: 247,
        isVeg: true,
        tags: ["momos", "veg"]
    },
    {
        name: "Chicken Momos",
        description: "Steamed dumplings filled with juicy seasoned chicken.",
        category: "Chinese",
        price: 190,
        discountPrice: 149,
        rating: 4.7,
        reviewCount: 274,
        isVeg: false,
        tags: ["momos", "chicken", "bestseller"]
    },
    {
        name: "Schezwan Paneer",
        description: "Paneer cubes tossed in spicy Schezwan sauce.",
        category: "Chinese",
        price: 250,
        discountPrice: 199,
        rating: 4.6,
        reviewCount: 92,
        isVeg: true,
        tags: ["paneer", "schezwan"]
    },
    {
        name: "Royal Chinese Platter",
        description: "A generous platter featuring noodles, fried rice and crispy starters.",
        category: "Chinese",
        price: 420,
        discountPrice: 329,
        rating: 4.9,
        reviewCount: 128,
        isVeg: true,
        tags: ["platter", "royal", "sharing"]
    },


    // =====================================================
    // PASTA — 15
    // =====================================================

    {
        name: "Classic White Sauce Pasta",
        description: "Creamy penne pasta cooked in rich white sauce.",
        category: "Pasta",
        price: 230,
        discountPrice: 179,
        rating: 4.6,
        reviewCount: 231,
        isVeg: true,
        tags: ["white sauce", "pasta"]
    },
    {
        name: "Arrabbiata Pasta",
        description: "Penne pasta tossed in spicy tomato and chilli sauce.",
        category: "Pasta",
        price: 220,
        discountPrice: 169,
        rating: 4.5,
        reviewCount: 164,
        isVeg: true,
        tags: ["arrabbiata", "spicy"]
    },
    {
        name: "Creamy Alfredo Pasta",
        description: "Rich and creamy Alfredo sauce with perfectly cooked pasta.",
        category: "Pasta",
        price: 260,
        discountPrice: 199,
        rating: 4.7,
        reviewCount: 185,
        isVeg: true,
        tags: ["alfredo", "creamy"]
    },
    {
        name: "Chicken Alfredo Pasta",
        description: "Creamy Alfredo pasta topped with tender chicken pieces.",
        category: "Pasta",
        price: 300,
        discountPrice: 239,
        rating: 4.8,
        reviewCount: 178,
        isVeg: false,
        tags: ["chicken", "alfredo"]
    },
    {
        name: "Chicken Arrabbiata Pasta",
        description: "Spicy tomato pasta with seasoned chicken pieces.",
        category: "Pasta",
        price: 290,
        discountPrice: 229,
        rating: 4.7,
        reviewCount: 132,
        isVeg: false,
        tags: ["chicken", "spicy"]
    },
    {
        name: "Pesto Pasta",
        description: "Fresh basil pesto tossed with pasta and parmesan.",
        category: "Pasta",
        price: 270,
        discountPrice: 209,
        rating: 4.6,
        reviewCount: 98,
        isVeg: true,
        tags: ["pesto", "basil"]
    },
    {
        name: "Mushroom Cream Pasta",
        description: "Creamy pasta with sautéed mushrooms and herbs.",
        category: "Pasta",
        price: 250,
        discountPrice: 189,
        rating: 4.6,
        reviewCount: 111,
        isVeg: true,
        tags: ["mushroom", "creamy"]
    },
    {
        name: "Cheesy Macaroni",
        description: "Comforting macaroni covered in creamy melted cheese.",
        category: "Pasta",
        price: 210,
        discountPrice: 159,
        rating: 4.5,
        reviewCount: 203,
        isVeg: true,
        tags: ["macaroni", "cheese"]
    },
    {
        name: "Spicy Chicken Penne",
        description: "Penne pasta with spicy chicken and tomato sauce.",
        category: "Pasta",
        price: 290,
        discountPrice: 229,
        rating: 4.7,
        reviewCount: 126,
        isVeg: false,
        tags: ["chicken", "penne", "spicy"]
    },
    {
        name: "Veg Loaded Pasta",
        description: "Pasta loaded with colourful vegetables and creamy sauce.",
        category: "Pasta",
        price: 240,
        discountPrice: 179,
        rating: 4.5,
        reviewCount: 114,
        isVeg: true,
        tags: ["veg", "loaded"]
    },
    {
        name: "Cheese Tomato Pasta",
        description: "Tomato pasta finished with melted mozzarella and herbs.",
        category: "Pasta",
        price: 230,
        discountPrice: 169,
        rating: 4.5,
        reviewCount: 103,
        isVeg: true,
        tags: ["tomato", "cheese"]
    },
    {
        name: "Tandoori Paneer Pasta",
        description: "Fusion pasta with smoky tandoori paneer and creamy sauce.",
        category: "Pasta",
        price: 280,
        discountPrice: 219,
        rating: 4.7,
        reviewCount: 89,
        isVeg: true,
        tags: ["paneer", "fusion"]
    },
    {
        name: "Chicken Pesto Pasta",
        description: "Basil pesto pasta with grilled chicken and parmesan.",
        category: "Pasta",
        price: 320,
        discountPrice: 249,
        rating: 4.8,
        reviewCount: 93,
        isVeg: false,
        tags: ["chicken", "pesto"]
    },
    {
        name: "Pink Sauce Pasta",
        description: "Creamy fusion pasta combining tomato and white sauce.",
        category: "Pasta",
        price: 250,
        discountPrice: 189,
        rating: 4.7,
        reviewCount: 145,
        isVeg: true,
        tags: ["pink sauce", "creamy"]
    },
    {
        name: "Royal Pasta Platter",
        description: "Signature creamy pasta with vegetables, cheese and herbs.",
        category: "Pasta",
        price: 330,
        discountPrice: 259,
        rating: 4.8,
        reviewCount: 76,
        isVeg: true,
        tags: ["royal", "signature"]
    },


    // =====================================================
    // NORTH INDIAN — 20
    // =====================================================

    {
        name: "Butter Chicken",
        description: "Tender chicken cooked in a rich buttery tomato gravy.",
        category: "North Indian",
        price: 320,
        discountPrice: 249,
        rating: 4.8,
        reviewCount: 421,
        isVeg: false,
        tags: ["chicken", "gravy", "bestseller"]
    },
    {
        name: "Chicken Tikka Masala",
        description: "Grilled chicken tikka simmered in creamy spiced tomato gravy.",
        category: "North Indian",
        price: 310,
        discountPrice: 239,
        rating: 4.7,
        reviewCount: 289,
        isVeg: false,
        tags: ["chicken", "tikka"]
    },
    {
        name: "Paneer Butter Masala",
        description: "Soft paneer cubes in creamy buttery tomato gravy.",
        category: "North Indian",
        price: 270,
        discountPrice: 209,
        rating: 4.8,
        reviewCount: 341,
        isVeg: true,
        tags: ["paneer", "gravy", "bestseller"]
    },
    {
        name: "Kadai Paneer",
        description: "Paneer cooked with peppers, onions and aromatic kadai spices.",
        category: "North Indian",
        price: 260,
        discountPrice: 199,
        rating: 4.7,
        reviewCount: 267,
        isVeg: true,
        tags: ["paneer", "kadai"]
    },
    {
        name: "Palak Paneer",
        description: "Soft paneer cooked in a creamy spinach gravy.",
        category: "North Indian",
        price: 250,
        discountPrice: 189,
        rating: 4.6,
        reviewCount: 198,
        isVeg: true,
        tags: ["paneer", "spinach"]
    },
    {
        name: "Dal Makhani",
        description: "Slow-cooked black lentils finished with butter and cream.",
        category: "North Indian",
        price: 220,
        discountPrice: 169,
        rating: 4.7,
        reviewCount: 315,
        isVeg: true,
        tags: ["dal", "bestseller"]
    },
    {
        name: "Dal Tadka",
        description: "Yellow lentils tempered with garlic, cumin and spices.",
        category: "North Indian",
        price: 190,
        discountPrice: 139,
        rating: 4.5,
        reviewCount: 204,
        isVeg: true,
        tags: ["dal", "value"]
    },
    {
        name: "Chole Masala",
        description: "Chickpeas cooked in a rich Punjabi-style spice gravy.",
        category: "North Indian",
        price: 200,
        discountPrice: 149,
        rating: 4.6,
        reviewCount: 241,
        isVeg: true,
        tags: ["chole", "punjabi"]
    },
    {
        name: "Rajma Masala",
        description: "Slow-cooked kidney beans in aromatic tomato gravy.",
        category: "North Indian",
        price: 200,
        discountPrice: 149,
        rating: 4.5,
        reviewCount: 188,
        isVeg: true,
        tags: ["rajma", "comfort food"]
    },
    {
        name: "Shahi Paneer",
        description: "Paneer cooked in a luxurious creamy cashew gravy.",
        category: "North Indian",
        price: 280,
        discountPrice: 219,
        rating: 4.7,
        reviewCount: 176,
        isVeg: true,
        tags: ["paneer", "shahi"]
    },
    {
        name: "Malai Kofta",
        description: "Soft paneer-potato dumplings served in creamy royal gravy.",
        category: "North Indian",
        price: 270,
        discountPrice: 209,
        rating: 4.7,
        reviewCount: 143,
        isVeg: true,
        tags: ["kofta", "royal"]
    },
    {
        name: "Chicken Korma",
        description: "Tender chicken simmered in a rich nutty and creamy gravy.",
        category: "North Indian",
        price: 330,
        discountPrice: 259,
        rating: 4.7,
        reviewCount: 127,
        isVeg: false,
        tags: ["chicken", "korma"]
    },
    {
        name: "Mutton Rogan Josh",
        description: "Tender mutton cooked in aromatic Kashmiri-style gravy.",
        category: "North Indian",
        price: 380,
        discountPrice: 299,
        rating: 4.8,
        reviewCount: 142,
        isVeg: false,
        tags: ["mutton", "kashmiri", "premium"]
    },
    {
        name: "Amritsari Chole",
        description: "Punjabi-style chickpeas with bold spices and tangy flavours.",
        category: "North Indian",
        price: 210,
        discountPrice: 159,
        rating: 4.6,
        reviewCount: 122,
        isVeg: true,
        tags: ["chole", "punjabi"]
    },
    {
        name: "Paneer Lababdar",
        description: "Paneer cooked in a creamy tomato and cashew gravy.",
        category: "North Indian",
        price: 280,
        discountPrice: 219,
        rating: 4.8,
        reviewCount: 154,
        isVeg: true,
        tags: ["paneer", "creamy"]
    },
    {
        name: "Chicken Handi",
        description: "Slow-cooked chicken in a rich traditional handi gravy.",
        category: "North Indian",
        price: 320,
        discountPrice: 249,
        rating: 4.7,
        reviewCount: 118,
        isVeg: false,
        tags: ["chicken", "handi"]
    },
    {
        name: "Matar Paneer",
        description: "Paneer and green peas cooked in tomato-based gravy.",
        category: "North Indian",
        price: 240,
        discountPrice: 179,
        rating: 4.5,
        reviewCount: 136,
        isVeg: true,
        tags: ["paneer", "peas"]
    },
    {
        name: "Aloo Gobi Masala",
        description: "Potatoes and cauliflower cooked with fragrant Indian spices.",
        category: "North Indian",
        price: 190,
        discountPrice: 139,
        rating: 4.4,
        reviewCount: 102,
        isVeg: true,
        tags: ["aloo", "gobi", "value"]
    },
    {
        name: "Jeera Rice",
        description: "Fragrant basmati rice tempered with cumin and herbs.",
        category: "North Indian",
        price: 150,
        discountPrice: 109,
        rating: 4.4,
        reviewCount: 154,
        isVeg: true,
        tags: ["rice", "cumin"]
    },
    {
        name: "Royal North Indian Thali",
        description: "Complete thali featuring dal, paneer, vegetable curry, rice, roti and dessert.",
        category: "North Indian",
        price: 390,
        discountPrice: 299,
        rating: 4.9,
        reviewCount: 219,
        isVeg: true,
        tags: ["thali", "royal", "complete meal"]
    },


    // =====================================================
    // SOUTH INDIAN — 20
    // =====================================================

    {
        name: "Masala Dosa",
        description: "Crispy dosa filled with spiced potato masala and served with chutney.",
        category: "South Indian",
        price: 150,
        discountPrice: 109,
        rating: 4.7,
        reviewCount: 432,
        isVeg: true,
        tags: ["dosa", "breakfast", "bestseller"]
    },
    {
        name: "Plain Dosa",
        description: "Classic crispy South Indian dosa served with chutney and sambar.",
        category: "South Indian",
        price: 120,
        discountPrice: 89,
        rating: 4.5,
        reviewCount: 241,
        isVeg: true,
        tags: ["dosa", "value"]
    },
    {
        name: "Mysore Masala Dosa",
        description: "Spicy Mysore dosa filled with potato masala.",
        category: "South Indian",
        price: 170,
        discountPrice: 129,
        rating: 4.7,
        reviewCount: 217,
        isVeg: true,
        tags: ["dosa", "mysore", "spicy"]
    },
    {
        name: "Rava Dosa",
        description: "Thin and crispy semolina dosa with aromatic spices.",
        category: "South Indian",
        price: 160,
        discountPrice: 119,
        rating: 4.6,
        reviewCount: 183,
        isVeg: true,
        tags: ["rava", "dosa"]
    },
    {
        name: "Onion Dosa",
        description: "Crispy dosa topped with caramelised onions and herbs.",
        category: "South Indian",
        price: 150,
        discountPrice: 109,
        rating: 4.5,
        reviewCount: 146,
        isVeg: true,
        tags: ["dosa", "onion"]
    },
    {
        name: "Idli Sambar",
        description: "Soft steamed idlis served with hot sambar and chutney.",
        category: "South Indian",
        price: 110,
        discountPrice: 79,
        rating: 4.6,
        reviewCount: 327,
        isVeg: true,
        tags: ["idli", "breakfast", "value"]
    },
    {
        name: "Medu Vada",
        description: "Crispy lentil fritters served with sambar and coconut chutney.",
        category: "South Indian",
        price: 120,
        discountPrice: 89,
        rating: 4.6,
        reviewCount: 224,
        isVeg: true,
        tags: ["vada", "breakfast"]
    },
    {
        name: "Pongal",
        description: "Comforting rice and lentil dish seasoned with pepper and cumin.",
        category: "South Indian",
        price: 130,
        discountPrice: 99,
        rating: 4.5,
        reviewCount: 118,
        isVeg: true,
        tags: ["pongal", "breakfast"]
    },
    {
        name: "Ven Pongal",
        description: "Traditional South Indian rice-lentil breakfast with ghee and pepper.",
        category: "South Indian",
        price: 140,
        discountPrice: 109,
        rating: 4.6,
        reviewCount: 102,
        isVeg: true,
        tags: ["pongal", "ghee"]
    },
    {
        name: "Upma",
        description: "Soft semolina breakfast cooked with vegetables and tempered spices.",
        category: "South Indian",
        price: 100,
        discountPrice: 69,
        rating: 4.4,
        reviewCount: 121,
        isVeg: true,
        tags: ["upma", "breakfast", "value"]
    },
    {
        name: "Vegetable Uttapam",
        description: "Thick savoury pancake topped with fresh vegetables.",
        category: "South Indian",
        price: 150,
        discountPrice: 109,
        rating: 4.5,
        reviewCount: 137,
        isVeg: true,
        tags: ["uttapam", "veg"]
    },
    {
        name: "Onion Uttapam",
        description: "Soft uttapam topped generously with onions and herbs.",
        category: "South Indian",
        price: 140,
        discountPrice: 99,
        rating: 4.5,
        reviewCount: 94,
        isVeg: true,
        tags: ["uttapam", "onion"]
    },
    {
        name: "Curd Rice",
        description: "Cooling rice mixed with creamy yogurt and tempered spices.",
        category: "South Indian",
        price: 110,
        discountPrice: 79,
        rating: 4.5,
        reviewCount: 168,
        isVeg: true,
        tags: ["curd rice", "comfort"]
    },
    {
        name: "Lemon Rice",
        description: "Tangy rice tempered with mustard, curry leaves and peanuts.",
        category: "South Indian",
        price: 120,
        discountPrice: 89,
        rating: 4.4,
        reviewCount: 112,
        isVeg: true,
        tags: ["lemon rice", "rice"]
    },
    {
        name: "Tamarind Rice",
        description: "Tangy tamarind rice with roasted peanuts and spices.",
        category: "South Indian",
        price: 120,
        discountPrice: 89,
        rating: 4.4,
        reviewCount: 87,
        isVeg: true,
        tags: ["tamarind", "rice"]
    },
    {
        name: "Bisibele Bath",
        description: "Karnataka-style rice and lentil dish with vegetables and spices.",
        category: "South Indian",
        price: 150,
        discountPrice: 109,
        rating: 4.6,
        reviewCount: 156,
        isVeg: true,
        tags: ["karnataka", "rice"]
    },
    {
        name: "Mini South Indian Combo",
        description: "Idli, vada, mini dosa and sambar in one delicious combo.",
        category: "South Indian",
        price: 180,
        discountPrice: 139,
        rating: 4.7,
        reviewCount: 191,
        isVeg: true,
        tags: ["combo", "breakfast"]
    },
    {
        name: "Paneer Dosa",
        description: "Crispy dosa filled with spiced paneer and vegetables.",
        category: "South Indian",
        price: 190,
        discountPrice: 149,
        rating: 4.7,
        reviewCount: 104,
        isVeg: true,
        tags: ["dosa", "paneer"]
    },
    {
        name: "Cheese Dosa",
        description: "Crispy dosa filled with melted cheese and herbs.",
        category: "South Indian",
        price: 180,
        discountPrice: 139,
        rating: 4.6,
        reviewCount: 133,
        isVeg: true,
        tags: ["dosa", "cheese"]
    },
    {
        name: "Royal South Indian Thali",
        description: "Complete South Indian meal with rice, curries, dosa, sambar and dessert.",
        category: "South Indian",
        price: 350,
        discountPrice: 269,
        rating: 4.9,
        reviewCount: 184,
        isVeg: true,
        tags: ["thali", "royal", "complete meal"]
    },


    // =====================================================
    // ROLLS & WRAPS — 15
    // =====================================================

    {
        name: "Veg Frankie",
        description: "Soft flatbread wrapped around spicy vegetable filling.",
        category: "Rolls & Wraps",
        price: 130,
        discountPrice: 99,
        rating: 4.4,
        reviewCount: 153,
        isVeg: true,
        tags: ["frankie", "veg"]
    },
    {
        name: "Chicken Frankie",
        description: "Spiced chicken filling wrapped in a soft Indian flatbread.",
        category: "Rolls & Wraps",
        price: 170,
        discountPrice: 129,
        rating: 4.6,
        reviewCount: 188,
        isVeg: false,
        tags: ["frankie", "chicken"]
    },
    {
        name: "Paneer Roll",
        description: "Soft roll filled with spicy paneer, onions and sauces.",
        category: "Rolls & Wraps",
        price: 160,
        discountPrice: 119,
        rating: 4.6,
        reviewCount: 176,
        isVeg: true,
        tags: ["paneer", "roll"]
    },
    {
        name: "Chicken Kathi Roll",
        description: "Classic Kolkata-style roll filled with seasoned chicken.",
        category: "Rolls & Wraps",
        price: 190,
        discountPrice: 149,
        rating: 4.7,
        reviewCount: 213,
        isVeg: false,
        tags: ["kathi", "chicken", "bestseller"]
    },
    {
        name: "Egg Kathi Roll",
        description: "Egg-filled Kolkata-style roll with onions and sauces.",
        category: "Rolls & Wraps",
        price: 150,
        discountPrice: 109,
        rating: 4.5,
        reviewCount: 131,
        isVeg: false,
        tags: ["egg", "kathi"]
    },
    {
        name: "Double Egg Roll",
        description: "Loaded roll with two eggs, onions and spicy sauces.",
        category: "Rolls & Wraps",
        price: 170,
        discountPrice: 129,
        rating: 4.5,
        reviewCount: 97,
        isVeg: false,
        tags: ["egg", "roll"]
    },
    {
        name: "Tandoori Chicken Wrap",
        description: "Tandoori chicken wrapped with fresh vegetables and mint sauce.",
        category: "Rolls & Wraps",
        price: 210,
        discountPrice: 159,
        rating: 4.7,
        reviewCount: 162,
        isVeg: false,
        tags: ["tandoori", "chicken"]
    },
    {
        name: "Peri Peri Chicken Wrap",
        description: "Spicy peri peri chicken with crunchy vegetables in a soft wrap.",
        category: "Rolls & Wraps",
        price: 210,
        discountPrice: 159,
        rating: 4.6,
        reviewCount: 104,
        isVeg: false,
        tags: ["peri-peri", "chicken"]
    },
    {
        name: "Mexican Veg Wrap",
        description: "Fresh vegetables, beans and salsa wrapped in a soft tortilla.",
        category: "Rolls & Wraps",
        price: 160,
        discountPrice: 119,
        rating: 4.5,
        reviewCount: 89,
        isVeg: true,
        tags: ["mexican", "veg"]
    },
    {
        name: "Cheese Paneer Wrap",
        description: "Paneer and melted cheese wrapped with fresh vegetables.",
        category: "Rolls & Wraps",
        price: 190,
        discountPrice: 149,
        rating: 4.7,
        reviewCount: 127,
        isVeg: true,
        tags: ["paneer", "cheese"]
    },
    {
        name: "Chicken Cheese Roll",
        description: "Juicy chicken and melted cheese wrapped in a soft roll.",
        category: "Rolls & Wraps",
        price: 220,
        discountPrice: 169,
        rating: 4.7,
        reviewCount: 145,
        isVeg: false,
        tags: ["chicken", "cheese"]
    },
    {
        name: "Schezwan Paneer Roll",
        description: "Paneer roll coated with spicy Schezwan sauce.",
        category: "Rolls & Wraps",
        price: 180,
        discountPrice: 139,
        rating: 4.6,
        reviewCount: 83,
        isVeg: true,
        tags: ["paneer", "schezwan"]
    },
    {
        name: "Crispy Chicken Wrap",
        description: "Crunchy chicken strips with lettuce and creamy dressing.",
        category: "Rolls & Wraps",
        price: 220,
        discountPrice: 169,
        rating: 4.8,
        reviewCount: 171,
        isVeg: false,
        tags: ["crispy", "chicken"]
    },
    {
        name: "Royal Mixed Wrap",
        description: "Signature wrap filled with chicken, egg, vegetables and cheese.",
        category: "Rolls & Wraps",
        price: 250,
        discountPrice: 199,
        rating: 4.8,
        reviewCount: 93,
        isVeg: false,
        tags: ["royal", "mixed", "signature"]
    },
    {
        name: "Aloo Masala Roll",
        description: "Affordable roll filled with spicy potato masala and onions.",
        category: "Rolls & Wraps",
        price: 110,
        discountPrice: 79,
        rating: 4.4,
        reviewCount: 138,
        isVeg: true,
        tags: ["aloo", "value"]
    },


    // =====================================================
    // DESSERTS — 15
    // =====================================================

    {
        name: "Gulab Jamun",
        description: "Soft milk dumplings soaked in fragrant sugar syrup.",
        category: "Desserts",
        price: 100,
        discountPrice: 69,
        rating: 4.7,
        reviewCount: 342,
        isVeg: true,
        tags: ["indian dessert", "sweet"]
    },
    {
        name: "Rasmalai",
        description: "Soft cheese dumplings soaked in chilled saffron milk.",
        category: "Desserts",
        price: 150,
        discountPrice: 109,
        rating: 4.7,
        reviewCount: 198,
        isVeg: true,
        tags: ["indian dessert", "premium"]
    },
    {
        name: "Chocolate Brownie",
        description: "Rich fudgy chocolate brownie served warm.",
        category: "Desserts",
        price: 140,
        discountPrice: 99,
        rating: 4.6,
        reviewCount: 267,
        isVeg: true,
        tags: ["chocolate", "brownie"]
    },
    {
        name: "Brownie with Ice Cream",
        description: "Warm chocolate brownie topped with creamy vanilla ice cream.",
        category: "Desserts",
        price: 190,
        discountPrice: 149,
        rating: 4.8,
        reviewCount: 243,
        isVeg: true,
        tags: ["brownie", "ice cream", "bestseller"]
    },
    {
        name: "Chocolate Lava Cake",
        description: "Warm chocolate cake with a molten chocolate centre.",
        category: "Desserts",
        price: 180,
        discountPrice: 139,
        rating: 4.8,
        reviewCount: 289,
        isVeg: true,
        tags: ["chocolate", "lava"]
    },
    {
        name: "Gajar Halwa",
        description: "Traditional carrot dessert slow-cooked with milk and nuts.",
        category: "Desserts",
        price: 130,
        discountPrice: 99,
        rating: 4.6,
        reviewCount: 112,
        isVeg: true,
        tags: ["halwa", "indian dessert"]
    },
    {
        name: "Kulfi",
        description: "Traditional creamy Indian frozen dessert with cardamom.",
        category: "Desserts",
        price: 110,
        discountPrice: 79,
        rating: 4.5,
        reviewCount: 156,
        isVeg: true,
        tags: ["kulfi", "indian dessert"]
    },
    {
        name: "Mango Cheesecake",
        description: "Creamy cheesecake layered with sweet mango flavour.",
        category: "Desserts",
        price: 210,
        discountPrice: 159,
        rating: 4.7,
        reviewCount: 91,
        isVeg: true,
        tags: ["cheesecake", "mango"]
    },
    {
        name: "Classic Cheesecake",
        description: "Smooth creamy cheesecake with a buttery biscuit base.",
        category: "Desserts",
        price: 200,
        discountPrice: 149,
        rating: 4.7,
        reviewCount: 124,
        isVeg: true,
        tags: ["cheesecake", "classic"]
    },
    {
        name: "Chocolate Mousse",
        description: "Light and creamy chocolate mousse with rich cocoa flavour.",
        category: "Desserts",
        price: 150,
        discountPrice: 109,
        rating: 4.6,
        reviewCount: 118,
        isVeg: true,
        tags: ["chocolate", "mousse"]
    },
    {
        name: "Kesar Pista Kulfi",
        description: "Saffron pistachio kulfi with a rich traditional flavour.",
        category: "Desserts",
        price: 140,
        discountPrice: 99,
        rating: 4.7,
        reviewCount: 93,
        isVeg: true,
        tags: ["kulfi", "pista"]
    },
    {
        name: "Fruit Cream",
        description: "Fresh seasonal fruits folded into lightly sweetened cream.",
        category: "Desserts",
        price: 150,
        discountPrice: 109,
        rating: 4.5,
        reviewCount: 86,
        isVeg: true,
        tags: ["fruit", "cream"]
    },
    {
        name: "Caramel Custard",
        description: "Silky baked custard topped with golden caramel.",
        category: "Desserts",
        price: 130,
        discountPrice: 99,
        rating: 4.6,
        reviewCount: 105,
        isVeg: true,
        tags: ["custard", "caramel"]
    },
    {
        name: "Rasmalai Tres Leches",
        description: "Fusion dessert combining rasmalai flavours with creamy milk cake.",
        category: "Desserts",
        price: 220,
        discountPrice: 169,
        rating: 4.8,
        reviewCount: 74,
        isVeg: true,
        tags: ["fusion", "rasmalai", "premium"]
    },
    {
        name: "Royal Dessert Platter",
        description: "Signature platter featuring assorted Indian and chocolate desserts.",
        category: "Desserts",
        price: 300,
        discountPrice: 229,
        rating: 4.9,
        reviewCount: 137,
        isVeg: true,
        tags: ["royal", "platter", "sharing"]
    },


    // =====================================================
    // BEVERAGES — 10
    // =====================================================

    {
        name: "Masala Chai",
        description: "Hot Indian tea brewed with milk and aromatic spices.",
        category: "Beverages",
        price: 80,
        discountPrice: 59,
        rating: 4.6,
        reviewCount: 241,
        isVeg: true,
        tags: ["tea", "hot", "value"]
    },
    {
        name: "Filter Coffee",
        description: "Strong South Indian filter coffee with rich milk foam.",
        category: "Beverages",
        price: 100,
        discountPrice: 69,
        rating: 4.8,
        reviewCount: 321,
        isVeg: true,
        tags: ["coffee", "south indian", "bestseller"]
    },
    {
        name: "Cold Coffee",
        description: "Creamy chilled coffee blended with milk and ice.",
        category: "Beverages",
        price: 150,
        discountPrice: 109,
        rating: 4.6,
        reviewCount: 231,
        isVeg: true,
        tags: ["coffee", "cold"]
    },
    {
        name: "Chocolate Milkshake",
        description: "Rich chocolate milkshake topped with creamy foam.",
        category: "Beverages",
        price: 180,
        discountPrice: 139,
        rating: 4.7,
        reviewCount: 198,
        isVeg: true,
        tags: ["milkshake", "chocolate"]
    },
    {
        name: "Mango Milkshake",
        description: "Creamy seasonal mango blended with chilled milk.",
        category: "Beverages",
        price: 170,
        discountPrice: 129,
        rating: 4.7,
        reviewCount: 154,
        isVeg: true,
        tags: ["mango", "milkshake"]
    },
    {
        name: "Fresh Lime Soda",
        description: "Refreshing lime soda available in sweet or salty style.",
        category: "Beverages",
        price: 100,
        discountPrice: 69,
        rating: 4.5,
        reviewCount: 187,
        isVeg: true,
        tags: ["lime", "refreshing"]
    },
    {
        name: "Sweet Lassi",
        description: "Thick chilled yogurt drink lightly sweetened and creamy.",
        category: "Beverages",
        price: 120,
        discountPrice: 89,
        rating: 4.6,
        reviewCount: 132,
        isVeg: true,
        tags: ["lassi", "yogurt"]
    },
    {
        name: "Mango Lassi",
        description: "Creamy yogurt blended with sweet ripe mango.",
        category: "Beverages",
        price: 140,
        discountPrice: 99,
        rating: 4.7,
        reviewCount: 176,
        isVeg: true,
        tags: ["lassi", "mango"]
    },
    {
        name: "Virgin Mojito",
        description: "Refreshing mint and lime cooler with sparkling soda.",
        category: "Beverages",
        price: 160,
        discountPrice: 119,
        rating: 4.6,
        reviewCount: 119,
        isVeg: true,
        tags: ["mocktail", "mint", "lime"]
    },
    {
        name: "Royal Rose Milk",
        description: "Chilled creamy milk infused with delicate rose flavour.",
        category: "Beverages",
        price: 130,
        discountPrice: 99,
        rating: 4.7,
        reviewCount: 83,
        isVeg: true,
        tags: ["rose", "royal", "milk"]
    }

];


// =====================================================
// INSERT MENU INTO MONGODB
// =====================================================

const CATEGORY_IMAGES = {
    "Biryani": "images/biryani.svg",
    "Pizza": "images/pizza.svg",
    "Burgers": "images/burgers.svg",
    "Chinese": "images/chinese.svg",
    "Pasta": "images/pasta.svg",
    "North Indian": "images/north-indian.svg",
    "South Indian": "images/south-indian.svg",
    "Rolls & Wraps": "images/rolls-wraps.svg",
    "Desserts": "images/desserts.svg",
    "Beverages": "images/beverages.svg"
};

const DEFAULT_RESTAURANT_EMAIL = "kitchen@thriftybite.com";

const getOrCreateDefaultRestaurant = async () => {
    let restaurant = await User.findOne({ email: DEFAULT_RESTAURANT_EMAIL });

    if (restaurant) {
        return restaurant;
    }

    const hashedPassword = await bcrypt.hash("thriftybite123", 10);

    restaurant = await User.create({
        username: "thriftybitekitchen",
        name: "Thrifty Bite Kitchen",
        ownerName: "Thrifty Bite",
        email: DEFAULT_RESTAURANT_EMAIL,
        password: hashedPassword,
        role: "RESTAURANT"
    });

    console.log(`Created default restaurant account: ${DEFAULT_RESTAURANT_EMAIL}`);

    return restaurant;
};

const seedMenu = async () => {
    try {

        console.log("Connecting to MongoDB...");

        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully.");

        const restaurant = await getOrCreateDefaultRestaurant();

        const dishPhotosPath = path.join(__dirname, "dish-photos.json");
        const dishPhotos = fs.existsSync(dishPhotosPath)
            ? JSON.parse(fs.readFileSync(dishPhotosPath, "utf8"))
            : {};

        const menuDataWithRestaurant = menuData.map((item) => ({
            ...item,
            restaurantId: restaurant._id,
            image: item.image || dishPhotos[item.name] || `images/dishes/${slugify(item.name)}.svg`
        }));

        console.log(`Preparing to insert ${menuDataWithRestaurant.length} menu items...`);

        await Menu.deleteMany({ restaurantId: restaurant._id });

        console.log("Existing menu items cleared.");

        const insertedItems = await Menu.insertMany(menuDataWithRestaurant);

        console.log(
            `Successfully inserted ${insertedItems.length} menu items.`
        );

        console.log("Menu seeding completed successfully.");

        await mongoose.connection.close();

        console.log("MongoDB connection closed.");

        process.exit(0);

    } catch (error) {

        console.error("Menu seeding failed:");
        console.error(error.message);

        await mongoose.connection.close();

        process.exit(1);
    }
};


module.exports = { menuData, CATEGORY_IMAGES };

if (require.main === module) {
    seedMenu();
}