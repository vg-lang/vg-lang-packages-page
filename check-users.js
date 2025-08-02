const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://husseinabdulameer11:PDF62htuKie5axuA@vg-packages-site-system.wfrhex7.mongodb.net/?retryWrites=true&w=majority&appName=vg-packages-site-system";

async function checkUsers() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('vg_package_manager');
    const users = db.collection('users');
    
    const allUsers = await users.find({}).toArray();
    
    console.log('Users in database:');
    allUsers.forEach(user => {
      console.log(`- Username: ${user.username}, Email: ${user.email}, Created: ${user.createdAt}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkUsers(); 