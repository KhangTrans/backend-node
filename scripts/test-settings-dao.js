require('dotenv').config();
const { connectMongoDB, mongoose } = require('../config/mongodb');
const settingsDao = require('../dao/settings.dao');

const runTest = async () => {
  try {
    // 1. Connect
    console.log('Connecting to DB...');
    await connectMongoDB();

    // 2. Get Settings (should create if not exists)
    console.log('\n--- Testing getSettings ---');
    let settings = await settingsDao.getSettings();
    console.log('Initial settings store name:', settings.store.name);

    // 3. Update Store
    console.log('\n--- Testing updateStore ---');
    const storeUpdate = {
      name: 'Test Store ' + Date.now(),
      phone: '0987654321',
      description: 'Updated via DAO test'
    };
    const updatedWithStore = await settingsDao.updateStore(storeUpdate);
    console.log('Updated store name:', updatedWithStore.store.name);
    console.log('Updated store phone:', updatedWithStore.store.phone);

    // 4. Update Appearance
    console.log('\n--- Testing updateAppearance ---');
    const appearanceUpdate = {
      primaryColor: '#ff0000',
      footerText: 'Test Footer ' + Date.now()
    };
    const updatedWithAppearance = await settingsDao.updateAppearance(appearanceUpdate);
    console.log('Updated primaryColor:', updatedWithAppearance.appearance.primaryColor);
    console.log('Updated footerText:', updatedWithAppearance.appearance.footerText);

    // 5. Add Banner
    console.log('\n--- Testing addBanner ---');
    const newBanner = {
      imageUrl: 'http://example.com/banner.jpg',
      order: 1
    };
    const addedBanners = await settingsDao.addBanner(newBanner);
    console.log('Banners count after add:', addedBanners.length);
    const addedBannerId = addedBanners[addedBanners.length - 1]._id;

    // 6. Update Banner
    console.log('\n--- Testing updateBanner ---');
    const bannerUpdate = {
      link: 'http://example.com/updated-link'
    };
    const updatedBanners = await settingsDao.updateBanner(addedBannerId, bannerUpdate);
    const updatedBanner = updatedBanners.find(b => b._id.toString() === addedBannerId.toString());
    console.log('Updated banner link:', updatedBanner.link);

    // 7. Delete Banner
    console.log('\n--- Testing deleteBanner ---');
    const deletedBanners = await settingsDao.deleteBanner(addedBannerId);
    console.log('Banners count after delete:', deletedBanners.length);

    console.log('\n✅ All DAO tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

runTest();
