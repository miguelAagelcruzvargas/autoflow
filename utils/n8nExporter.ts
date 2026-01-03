import { NodeInstance, Connection } from '../types';

interface N8nConnection {
    node: string;
    type: string;
    index: number;
}

interface N8nConnections {
    [sourceNodeName: string]: {
        [outputType: string]: N8nConnection[][]; // n8n uses array of arrays for output connections
    };
}

export function exportToN8n(nodes: NodeInstance[], connections: Connection[]) {
    // 1. Ensure unique names (n8n relies on names for connections)
    // We'll create a map of id -> uniqueName to facilitate connection mapping
    const nameCounts: Record<string, number> = {};
    const idToName: Record<string, string> = {};

    const cleanNodes = nodes.map(node => {
        let baseName = node.name || node.type;
        // Clean special characters to be safe (optional but good practice)
        baseName = baseName.replace(/[^a-zA-Z0-9 _-]/g, '');

        if (!nameCounts[baseName]) {
            nameCounts[baseName] = 0;
        }
        nameCounts[baseName]++;

        const uniqueName = nameCounts[baseName] > 1 ? `${baseName} ${nameCounts[baseName]}` : baseName;
        idToName[node.id] = uniqueName;

        return {
            parameters: { ...node.config, ...node.customParams },
            name: uniqueName,
            type: node.n8nType,
            typeVersion: node.n8nVersion || 1,
            position: [node.position.x, node.position.y],
            id: node.id // n8n ignores this but helpful for debugging
        };
    });

    // 2. Build Connections Object
    const n8nConnections: N8nConnections = {};

    connections.forEach(conn => {
        const sourceName = idToName[conn.source];
        const targetName = idToName[conn.target];

        if (!sourceName || !targetName) return; // Skip if nodes missing

        if (!n8nConnections[sourceName]) {
            n8nConnections[sourceName] = {};
        }

        // Default handle is usually 'main' for standard inputs/outputs
        // You might store specific output names in conn.sourceHandle if complex
        const outputType = 'main'; // Autoflow typically acts on 'main' flow. 
        // Note: For IF nodes or Switch, handleId might be 'true', 'false', '0', '1', etc.
        // We need to map our handle IDs to n8n's output index if possible.
        // For now, defaulting to 'main' [0] for simplicity unless we map handle names.

        // Advanced: Map 'true'/'false' handles for IF nodes
        // n8n IF node: output 0 = true, output 1 = false (usually) or labeled main/main
        // Actually n8n v2 IF node has 'main' output but splits logic internally or has 2 outputs.
        // Let's assume standard 'main' connection for now.

        if (!n8nConnections[sourceName][outputType]) {
            n8nConnections[sourceName][outputType] = [];
        }

        // Ensure array structure matches index
        // n8n expects: main: [ [target1], [target2] ] where index 0 is output 0
        // We'll just push to the first output for now (index 0)
        if (n8nConnections[sourceName][outputType].length === 0) {
            n8nConnections[sourceName][outputType].push([]);
        }

        n8nConnections[sourceName][outputType][0].push({
            node: targetName,
            type: 'main',
            index: 0
        });
    });

    return {
        nodes: cleanNodes,
        connections: n8nConnections
    };
}
