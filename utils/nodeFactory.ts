import { NodeInstance, NodeType } from '../types';
import { NODE_CATALOG } from '../constants';
import { generateId } from './helpers';

/**
 * Factory function to create a new node instance with all required properties
 * from the catalog template
 */
export function createNode(
    type: NodeType,
    position: { x: number; y: number },
    nodeNames: Record<string, string>,
    config?: Record<string, any>
): NodeInstance | null {
    const template = NODE_CATALOG.find(n => n.type === type);

    if (!template) {
        console.warn(`Node type "${type}" not found in catalog`);
        return null;
    }

    return {
        id: generateId(),
        type,
        name: nodeNames[type] || template.name,
        n8nType: template.n8nType,
        n8nVersion: template.n8nVersion,
        position,
        icon: template.icon,
        bg: template.bg,
        color: template.color,
        category: template.category,
        border: template.border,
        fields: template.fields,
        desc: template.desc,
        config: config || {},
        customParams: {}
    };
}
