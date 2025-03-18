require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Profile = require('../models/Profile');

const locations = [
  {
    name: 'Moraine Lake, Canada',
    coordinates: { latitude: 51.3217, longitude: -116.1860 },
    description: 'A stunning glacier-fed lake in Banff National Park, known for its vibrant turquoise waters and dramatic mountain backdrop.',
    tips: [
      'Arrive before 6 AM to secure parking and avoid crowds.',
      'Hike the Rockpile Trail for the iconic view of the lake.',
      'Visit between June and September when the road is open.'
    ],
    weather: { temp: 12, description: 'Sunny', icon: 'sun' }
  },
  {
    name: 'Kyoto, Japan',
    coordinates: { latitude: 35.0116, longitude: 135.7681 },
    description: 'A city steeped in history, famous for its ancient temples, traditional tea houses, and breathtaking cherry blossoms.',
    tips: [
      'Visit the Fushimi Inari Shrine early in the morning for fewer crowds.',
      'Experience a tea ceremony in the Gion district.',
      'Explore the Arashiyama Bamboo Grove at sunset for a magical atmosphere.'
    ],
    weather: { temp: 18, description: 'Partly Cloudy', icon: 'cloud-sun' }
  },
  {
    name: 'Machu Picchu, Peru',
    coordinates: { latitude: -13.1631, longitude: -72.5450 },
    description: 'The iconic Incan citadel perched high in the Andes, offering breathtaking views and a glimpse into ancient history.',
    tips: [
      'Book your tickets at least 3 months in advance.',
      'Take the early morning bus to catch the sunrise over the ruins.',
      'Hire a local guide to learn about the history and significance of the site.'
    ],
    weather: { temp: 19, description: 'Clear', icon: 'sun' }
  },
  {
    name: 'Banff National Park, Canada',
    coordinates: { latitude: 51.4968, longitude: -115.9281 },
    description: 'A pristine wilderness of turquoise lakes, snow-capped peaks, and abundant wildlife.',
    tips: [
      'Visit Lake Louise at sunrise for the best photos.',
      'Take the Banff Gondola for panoramic views of the Rockies.',
      'Keep an eye out for elk and bears, especially in the early morning.'
    ],
    weather: { temp: 14, description: 'Clear', icon: 'sun' }
  },
  {
    name: 'Amalfi Coast, Italy',
    coordinates: { latitude: 40.6333, longitude: 14.6029 },
    description: 'A picturesque coastline dotted with colorful cliffside villages, lemon groves, and crystal-clear waters.',
    tips: [
      'Take a boat tour to see the coast from the water.',
      'Visit Positano for its iconic pastel-colored houses.',
      'Try the local limoncello and fresh seafood.'
    ],
    weather: { temp: 25, description: 'Sunny', icon: 'sun' }
  },
  {
    name: 'Bali, Indonesia',
    coordinates: { latitude: -8.4095, longitude: 115.1889 },
    description: 'A tropical paradise known for its lush rice terraces, vibrant culture, and stunning beaches.',
    tips: [
      'Visit the Tegallalang Rice Terraces early in the morning.',
      'Explore the Uluwatu Temple and watch the Kecak dance at sunset.',
      'Try the local dish, Nasi Goreng, at a traditional warung.'
    ],
    weather: { temp: 28, description: 'Tropical', icon: 'sun' }
  },
  {
    name: 'Cappadocia, Turkey',
    coordinates: { latitude: 38.6431, longitude: 34.8307 },
    description: 'A surreal landscape of fairy chimneys, cave dwellings, and hot air balloons.',
    tips: [
      'Book a hot air balloon ride for a sunrise flight.',
      'Stay in a cave hotel for a unique experience.',
      'Explore the underground cities of Derinkuyu and Kaymakli.'
    ],
    weather: { temp: 22, description: 'Clear', icon: 'sun' }
  },
  {
    name: 'Northern Lights, Iceland',
    coordinates: { latitude: 64.9631, longitude: -19.0208 },
    description: 'The mesmerizing aurora borealis dancing across the Arctic sky.',
    tips: [
      'Visit between September and March for the best chance to see the lights.',
      'Check the aurora forecast and head to remote areas for clear skies.',
      'Bring a tripod for long-exposure photos of the lights.'
    ],
    weather: { temp: -3, description: 'Clear Night', icon: 'moon' }
  },
  {
    name: 'Great Barrier Reef, Australia',
    coordinates: { latitude: -18.2871, longitude: 147.6992 },
    description: 'The world\'s largest coral reef system, home to vibrant marine life and crystal-clear waters.',
    tips: [
      'Go snorkeling or diving to explore the coral reefs.',
      'Visit the Whitsunday Islands for pristine beaches.',
      'Choose eco-friendly tours to protect the reef.'
    ],
    weather: { temp: 26, description: 'Sunny', icon: 'sun' }
  },
  {
    name: 'Sahara Desert, Morocco',
    coordinates: { latitude: 31.7917, longitude: -7.0926 },
    description: 'The world\'s largest hot desert, offering endless golden dunes and starry skies.',
    tips: [
      'Take a camel trek to a desert camp for an authentic experience.',
      'Spend the night in a traditional Berber camp.',
      'Wake up early to watch the sunrise over the dunes.'
    ],
    weather: { temp: 34, description: 'Clear', icon: 'sun' }
  },
  {
    name: 'Angkor Wat, Cambodia',
    coordinates: { latitude: 13.4125, longitude: 103.8670 },
    description: 'The largest religious monument in the world, showcasing incredible Khmer architecture.',
    tips: [
      'Arrive before sunrise to see the temple reflected in the moat.',
      'Hire a guide to learn about the history and symbolism of the carvings.',
      'Explore lesser-known temples like Ta Prohm and Banteay Srei.'
    ],
    weather: { temp: 29, description: 'Partly Cloudy', icon: 'cloud-sun' }
  },
  {
    name: 'Cinque Terre, Italy',
    coordinates: { latitude: 44.1461, longitude: 9.6439 },
    description: 'Five colorful coastal villages connected by scenic hiking trails.',
    tips: [
      'Hike the Sentiero Azzurro trail for stunning views.',
      'Try the local pesto and fresh seafood.',
      'Buy a Cinque Terre Card for unlimited train travel between villages.'
    ],
    weather: { temp: 23, description: 'Sunny', icon: 'sun' }
  },
  {
    name: 'Zhangjiajie, China',
    coordinates: { latitude: 29.1170, longitude: 110.4794 },
    description: 'A UNESCO World Heritage Site known for its towering sandstone pillars and misty landscapes.',
    tips: [
      'Take the Bailong Elevator for panoramic views.',
      'Visit the Avatar Hallelujah Mountain for iconic scenery.',
      'Allow 2-3 days to fully explore the park.'
    ],
    weather: { temp: 19, description: 'Misty', icon: 'cloud' }
  }
];

const images = [
  'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80', // Moraine Lake
  'https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80', // Kyoto
  'https://images.unsplash.com/photo-1526392060635-9d6019884377?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80', // Machu Picchu
  'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80', // Banff National Park
  'https://images.unsplash.com/photo-1515859005217-8a1f08870f59?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80', // Amalfi Coast
  'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80', // Bali
  'https://images.unsplash.com/photo-1519312925718-5d0f0a4bcd32?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80', // Cappadocia
  'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80', // Northern Lights
  'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80', // Great Barrier Reef
  'https://images.unsplash.com/photo-1503174971373-b1f69850bded?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80', // Sahara Desert
  'https://images.unsplash.com/photo-1528181304800-259b08848526?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80', // Angkor Wat
  'https://images.unsplash.com/photo-1515859005217-8a1f08870f59?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80', // Cinque Terre
  'https://images.unsplash.com/photo-1515859005217-8a1f08870f59?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80'  // Zhangjiajie
];

async function createPosts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all creators
    const creators = await User.find({ accountType: 'creator' });
    console.log(`Found ${creators.length} creators`);

    for (const creator of creators) {
      try {
        console.log(`Creating posts for ${creator.username}`);
        
        // Each creator gets 3-5 random posts
        const numPosts = Math.floor(Math.random() * 3) + 3; // 3-5 posts
        
        for (let i = 0; i < numPosts; i++) {
          // Get random location and image
          const location = locations[Math.floor(Math.random() * locations.length)];
          const image = images[Math.floor(Math.random() * images.length)];

          const post = new Post({
            userId: creator._id,
            image,
            description: `${location.description}\n\nExploring the beauty of ${location.name}. ${location.tips[0]}`,
            location: {
              name: location.name,
              coordinates: location.coordinates
            },
            weather: location.weather,
            travelTips: location.tips
          });

          await post.save();

          // Update creator's post count
          await Profile.findOneAndUpdate(
            { userId: creator._id },
            { $inc: { 'stats.totalPosts': 1 } }
          );

          console.log(`Created post for ${creator.username} at ${location.name}`);
        }
      } catch (error) {
        console.error(`Error creating posts for ${creator.username}:`, error.message);
      }
    }

    console.log('Finished creating posts');
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createPosts(); 