// API Integration Test Script
// Run: npx ts-node api-test.ts

const API_BASE_URL = 'http://localhost:5001/api';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  statusCode?: number;
  data?: any;
  error?: string;
}

const results: TestResult[] = [];

async function request(method: string, endpoint: string, body?: any, token?: string) {
  const headers: any = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: any = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error: any) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

async function testHealthCheck() {
  console.log('\n🧪 TEST 1: Health Check');
  console.log('━'.repeat(50));

  try {
    const response = await fetch('http://localhost:5001/health');
    const data = await response.json();

    if (response.ok && data.status === 'OK') {
      results.push({
        name: 'Health Check',
        status: 'PASS',
        statusCode: response.status,
        data,
      });
      console.log('✅ PASS: Server is healthy');
      console.log(`   Status: ${data.status}`);
      console.log(`   Uptime: ${data.uptime.toFixed(2)}s`);
      return true;
    } else {
      results.push({
        name: 'Health Check',
        status: 'FAIL',
        statusCode: response.status,
      });
      console.log('❌ FAIL: Server health check failed');
      return false;
    }
  } catch (error: any) {
    results.push({
      name: 'Health Check',
      status: 'FAIL',
      error: error.message,
    });
    console.log(`❌ FAIL: ${error.message}`);
    return false;
  }
}

async function testRegister() {
  console.log('\n🧪 TEST 2: User Registration');
  console.log('━'.repeat(50));

  const testData = {
    email: `test.${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User',
    phone: '+27123456789',
  };

  const result = await request('POST', '/auth/register', testData);

  if (result.ok && result.data.token) {
    results.push({
      name: 'User Registration',
      status: 'PASS',
      statusCode: result.status,
      data: result.data.user,
    });
    console.log('✅ PASS: User registered successfully');
    console.log(`   Email: ${result.data.user.email}`);
    console.log(`   Name: ${result.data.user.name}`);
    console.log(`   Token: ${result.data.token.substring(0, 20)}...`);
    return {
      token: result.data.token,
      email: result.data.user.email,
      userId: result.data.user.id,
    };
  } else {
    results.push({
      name: 'User Registration',
      status: 'FAIL',
      statusCode: result.status,
      error: result.data?.error,
    });
    console.log(`❌ FAIL: Registration failed`);
    if (result.data?.error) {
      console.log(`   Error: ${result.data.error}`);
    }
    return null;
  }
}

async function testLogin(email: string, password: string) {
  console.log('\n🧪 TEST 3: User Login');
  console.log('━'.repeat(50));

  const result = await request('POST', '/auth/login', {
    email,
    password,
  });

  if (result.ok && result.data.token) {
    results.push({
      name: 'User Login',
      status: 'PASS',
      statusCode: result.status,
    });
    console.log('✅ PASS: Login successful');
    console.log(`   Email: ${result.data.user.email}`);
    console.log(`   Token: ${result.data.token.substring(0, 20)}...`);
    return result.data.token;
  } else {
    results.push({
      name: 'User Login',
      status: 'FAIL',
      statusCode: result.status,
      error: result.data?.error,
    });
    console.log(`❌ FAIL: Login failed`);
    if (result.data?.error) {
      console.log(`   Error: ${result.data.error}`);
    }
    return null;
  }
}

async function testGetProfile(token: string) {
  console.log('\n🧪 TEST 4: Get User Profile');
  console.log('━'.repeat(50));

  const result = await request('GET', '/auth/profile', null, token);

  if (result.ok && result.data.id) {
    results.push({
      name: 'Get Profile',
      status: 'PASS',
      statusCode: result.status,
    });
    console.log('✅ PASS: Profile retrieved');
    console.log(`   ID: ${result.data.id}`);
    console.log(`   Email: ${result.data.email}`);
    console.log(`   Name: ${result.data.name}`);
    return true;
  } else {
    results.push({
      name: 'Get Profile',
      status: 'FAIL',
      statusCode: result.status,
      error: result.data?.error,
    });
    console.log(`❌ FAIL: Profile retrieval failed`);
    if (result.data?.error) {
      console.log(`   Error: ${result.data.error}`);
    }
    return false;
  }
}

async function testWalletBalance(token: string) {
  console.log('\n🧪 TEST 5: Get Wallet Balance');
  console.log('━'.repeat(50));

  const result = await request('GET', '/wallet/balance', null, token);

  if (result.ok) {
    results.push({
      name: 'Wallet Balance',
      status: 'PASS',
      statusCode: result.status,
      data: result.data,
    });
    console.log('✅ PASS: Wallet balance retrieved');
    console.log(`   Amount: ZAR ${result.data.amount || 0}`);
    console.log(`   Currency: ${result.data.currency || 'ZAR'}`);
    return true;
  } else {
    results.push({
      name: 'Wallet Balance',
      status: 'FAIL',
      statusCode: result.status,
      error: result.data?.error || 'No balance data returned',
    });
    console.log(`❌ FAIL: Balance retrieval failed`);
    if (result.data?.error) {
      console.log(`   Error: ${result.data.error}`);
    }
    return false;
  }
}

async function testAddFunds(token: string) {
  console.log('\n🧪 TEST 6: Add Funds to Wallet');
  console.log('━'.repeat(50));

  const result = await request(
    'POST',
    '/wallet/add-funds',
    {
      amount: 1000,
      paymentMethod: 'BANK_TRANSFER',
    },
    token
  );

  if (result.ok) {
    results.push({
      name: 'Add Funds',
      status: 'PASS',
      statusCode: result.status,
    });
    console.log('✅ PASS: Funds addition initiated');
    console.log(`   Amount: ZAR ${result.data.amount}`);
    console.log(`   Message: ${result.data.message}`);
    return true;
  } else {
    results.push({
      name: 'Add Funds',
      status: 'FAIL',
      statusCode: result.status,
      error: result.data?.error || 'Unknown error',
    });
    console.log(`❌ FAIL: Add funds failed`);
    if (result.data?.error) {
      console.log(`   Error: ${result.data.error}`);
    }
    return false;
  }
}

async function testGetTransactions(token: string) {
  console.log('\n🧪 TEST 7: Get Transaction History');
  console.log('━'.repeat(50));

  const result = await request('GET', '/wallet/transactions?page=1&limit=10', null, token);

  if (result.ok && Array.isArray(result.data.transactions)) {
    results.push({
      name: 'Get Transactions',
      status: 'PASS',
      statusCode: result.status,
    });
    console.log('✅ PASS: Transactions retrieved');
    console.log(`   Count: ${result.data.transactions.length}`);
    console.log(`   Total: ${result.data.total}`);
    return true;
  } else {
    results.push({
      name: 'Get Transactions',
      status: 'FAIL',
      statusCode: result.status,
      error: result.data?.error || 'Invalid response format',
    });
    console.log(`❌ FAIL: Transaction retrieval failed`);
    if (result.data?.error) {
      console.log(`   Error: ${result.data.error}`);
    }
    return false;
  }
}

async function testEscrowCreate(token: string, buyerId: string) {
  console.log('\n🧪 TEST 8: Create Escrow Transaction');
  console.log('━'.repeat(50));

  const result = await request(
    'POST',
    '/escrow/create',
    {
      buyerId,
      sellerId: 'seller-id-placeholder',
      itemDescription: 'Test Item',
      amount: 5000,
      currency: 'ZAR',
    },
    token
  );

  if (result.ok && result.data.id) {
    results.push({
      name: 'Create Escrow',
      status: 'PASS',
      statusCode: result.status,
      data: result.data,
    });
    console.log('✅ PASS: Escrow created');
    console.log(`   ID: ${result.data.id}`);
    console.log(`   Status: ${result.data.status}`);
    console.log(`   Amount: ZAR ${result.data.amount}`);
    return result.data.id;
  } else {
    results.push({
      name: 'Create Escrow',
      status: 'FAIL',
      statusCode: result.status,
      error: result.data?.error || 'Unknown error',
    });
    console.log(`❌ FAIL: Escrow creation failed`);
    if (result.data?.error) {
      console.log(`   Error: ${result.data.error}`);
    }
    return null;
  }
}

async function printSummary() {
  console.log('\n' + '═'.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(50));

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const total = results.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  console.log('\nDetailed Results:');
  console.log('─'.repeat(50));
  results.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.name}`);
    if (result.statusCode) {
      console.log(`   Status Code: ${result.statusCode}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '═'.repeat(50));
  console.log(
    passed === total
      ? '🎉 ALL TESTS PASSED!'
      : `⚠️  ${failed} test(s) failed - review errors above`
  );
  console.log('═'.repeat(50) + '\n');
}

async function runTests() {
  console.log('╔' + '═'.repeat(48) + '╗');
  console.log('║' + '  API INTEGRATION TEST SUITE'.padEnd(49) + '║');
  console.log('║' + '  Backend: http://localhost:5001/api'.padEnd(49) + '║');
  console.log('╚' + '═'.repeat(48) + '╝');

  // Test 1: Health check
  const healthy = await testHealthCheck();
  if (!healthy) {
    console.log('\n❌ Backend is not responding. Aborting tests.');
    return;
  }

  // Test 2-4: Auth flow
  const registerData = await testRegister();
  if (!registerData) {
    console.log('\n⚠️ Registration failed. Skipping dependent tests.');
    await printSummary();
    return;
  }

  const loginToken = await testLogin(registerData.email, 'TestPassword123!');
  if (!loginToken) {
    console.log('\n⚠️ Login failed. Skipping dependent tests.');
    await printSummary();
    return;
  }

  await testGetProfile(loginToken);

  // Test 5-7: Wallet operations
  await testWalletBalance(loginToken);
  await testAddFunds(loginToken);
  await testGetTransactions(loginToken);

  // Test 8: Escrow
  await testEscrowCreate(loginToken, registerData.userId);

  await printSummary();
}

// Run tests
runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
