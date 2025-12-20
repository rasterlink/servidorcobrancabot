const RAILWAY_API_TOKEN = '6aa2eb4e-b84b-482d-b388-8fff3d655028';
const RAILWAY_SERVICE_ID = 'a2d9fa00-168b-4fbd-b54a-03c73aaa6905';

async function getDeployments() {
  const query = `
    query deployments($serviceId: String!, $first: Int) {
      deployments(serviceId: $serviceId, first: $first) {
        edges {
          node {
            id
            status
            createdAt
            meta
          }
        }
      }
    }
  `;

  const response = await fetch('https://backboard.railway.app/graphql/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RAILWAY_API_TOKEN}`
    },
    body: JSON.stringify({
      query,
      variables: { serviceId: RAILWAY_SERVICE_ID, first: 1 }
    })
  });

  const data = await response.json();

  if (data.errors) {
    console.error('Erro:', JSON.stringify(data.errors, null, 2));
    return null;
  }

  return data.data;
}

async function getLogs(deploymentId) {
  const query = `
    query deploymentLogs($deploymentId: String!, $limit: Int) {
      deploymentLogs(deploymentId: $deploymentId, limit: $limit) {
        message
        timestamp
        severity
      }
    }
  `;

  const response = await fetch('https://backboard.railway.app/graphql/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RAILWAY_API_TOKEN}`
    },
    body: JSON.stringify({
      query,
      variables: { deploymentId, limit: 50 }
    })
  });

  const data = await response.json();

  if (data.errors) {
    console.error('Erro:', JSON.stringify(data.errors, null, 2));
    return null;
  }

  return data.data;
}

async function checkStatus() {
  console.log('🔍 Verificando status do Railway...\n');

  const deployments = await getDeployments();

  if (!deployments || !deployments.deployments.edges[0]) {
    console.log('❌ Nenhum deployment encontrado');
    return;
  }

  const latestDeployment = deployments.deployments.edges[0].node;
  console.log('📦 Último deployment:');
  console.log(`   ID: ${latestDeployment.id}`);
  console.log(`   Status: ${latestDeployment.status}`);
  console.log(`   Criado em: ${latestDeployment.createdAt}\n`);

  console.log('📋 Últimos logs:\n');
  const logs = await getLogs(latestDeployment.id);

  if (logs && logs.deploymentLogs) {
    logs.deploymentLogs.forEach(log => {
      const time = new Date(log.timestamp).toLocaleTimeString('pt-BR');
      const severity = log.severity.padEnd(7);
      console.log(`[${time}] ${severity} ${log.message}`);
    });
  }
}

checkStatus().catch(console.error);
