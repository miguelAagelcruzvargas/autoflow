import { NodeInstance, Connection } from '../types';
import { NODE_CATALOG, WORKFLOW_TEMPLATES, SAMPLE_TEMPLATES } from '../constants';
import { generateId } from './helpers';

/**
 * Hydrates a template with catalog data and generates new IDs
 */
export function hydrateTemplate(
    templateId: string,
    nodeNames: Record<string, string>
): { nodes: NodeInstance[]; connections: Connection[] } | null {
    const template = WORKFLOW_TEMPLATES.find(t => t.id === templateId) ||
        SAMPLE_TEMPLATES.find(t => t.id === templateId);

    if (!template) {
        console.warn(`Template "${templateId}" not found`);
        return null;
    }

    // Regenerate IDs to avoid conflicts
    const newNodes = template.nodes.map(n => {
        const catalogNode = NODE_CATALOG.find(cat => cat.type === n.type);
        return {
            ...catalogNode,
            ...n,
            id: generateId(),
            fields: catalogNode?.fields || [],
            icon: catalogNode?.icon,
            color: catalogNode?.color,
            bg: catalogNode?.bg,
            border: catalogNode?.border,
            name: nodeNames[n.type] || catalogNode?.name || n.name
        } as NodeInstance;
    });

    // Map connections using array indices
    const newConnections = template.connections.map(c => ({
        ...c,
        id: generateId(),
        source: newNodes[c.source as number]?.id,
        target: newNodes[c.target as number]?.id
    }));

    return { nodes: newNodes, connections: newConnections };
}
