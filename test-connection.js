const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://husseinabdulameer11:Lumia530@vg-packages-site-system.wfrhex7.mongodb.net/?retryWrites=true&w=majority&appName=vg-packages-site-system";

async function testConnection() {
  const client = new MongoClient(uri);
  
  try {
    console.log('🔗 Testing MongoDB connection...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');
    
    const db = client.db('vg_package_manager');
    const users = db.collection('users');
    
    const userCount = await users.countDocuments();
    console.log(`📊 Found ${userCount} users in the database`);
    
    if (userCount > 0) {
      const allUsers = await users.find({}).limit(5).toArray();
      console.log('👥 Sample users:');
      allUsers.forEach(user => {
        console.log(`  - ${user.username} (${user.email})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await client.close();
  }
}

testConnection(); 