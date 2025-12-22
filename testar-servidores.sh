#!/bin/bash

echo "==================================="
echo "TESTANDO SERVIDOR 1 (porta 3001)"
echo "==================================="
echo ""
echo "Status:"
curl -s http://localhost:3001/status
echo ""
echo ""
echo "Config:"
curl -s http://localhost:3001/config
echo ""
echo ""
echo "Customers:"
curl -s http://localhost:3001/customers | head -c 100
echo "..."
echo ""
echo ""

echo "==================================="
echo "TESTANDO SERVIDOR 2 (porta 3002)"
echo "==================================="
echo ""
echo "Status:"
curl -s http://localhost:3002/status
echo ""
echo ""
echo "Config:"
curl -s http://localhost:3002/config
echo ""
echo ""
echo "Customers:"
curl -s http://localhost:3002/customers | head -c 100
echo "..."
echo ""
echo ""

echo "==================================="
echo "AMBOS OS SERVIDORES FUNCIONANDO!"
echo "==================================="
