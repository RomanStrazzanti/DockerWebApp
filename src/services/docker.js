const docker = require('../config/docker');

class DockerService {
    async listContainers(filters = {}) {
        try {
            const containers = await docker.listContainers({ all: true, filters });
            return containers.map(c => ({
                id: c.Id.substring(0, 12),
                name: c.Names[0]?.replace(/\//g, ''),
                status: c.State.toLowerCase(),
                image: c.Image,
                ports: c.Ports,
                created: c.Created,
            }));
        } catch (err) {
            throw new Error(`Failed to list containers: ${err.message}`);
        }
    }

    async getContainer(id) {
        try {
            const container = docker.getContainer(id);
            const data = await container.inspect();
            return data;
        } catch (err) {
            throw new Error(`Container not found: ${err.message}`);
        }
    }

    async getStats(id) {
        try {
            const container = docker.getContainer(id);
            const stats = await container.stats({ stream: false });
            
            const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - (stats.precpu_stats.cpu_usage.total_usage || 0);
            const systemDelta = stats.cpu_stats.system_cpu_usage - (stats.precpu_stats.system_cpu_usage || 0);
            const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * 100 : 0;
            
            const memoryUsage = stats.memory_stats.usage || 0;
            const memoryLimit = stats.memory_stats.limit || 0;
            const memoryPercent = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;

            return {
                cpu: isNaN(cpuPercent) ? 0 : cpuPercent.toFixed(2),
                memory: isNaN(memoryPercent) ? 0 : memoryPercent.toFixed(2),
                memoryUsage: (memoryUsage / (1024 * 1024)).toFixed(2),
                memoryLimit: (memoryLimit / (1024 * 1024)).toFixed(2),
            };
        } catch (err) {
            throw new Error(`Failed to get stats: ${err.message}`);
        }
    }

    async getLogs(id, tail = 100) {
        try {
            const container = docker.getContainer(id);
            const logs = await container.logs({
                stdout: true,
                stderr: true,
                tail,
            });
            return logs.toString().split('\n').filter(Boolean);
        } catch (err) {
            throw new Error(`Failed to get logs: ${err.message}`);
        }
    }

    async createContainer(options) {
        try {
            const container = await docker.createContainer(options);
            return { id: container.id.substring(0, 12), ...container };
        } catch (err) {
            throw new Error(`Failed to create container: ${err.message}`);
        }
    }

    async startContainer(id) {
        try {
            const container = docker.getContainer(id);
            await container.start();
            return { success: true, id };
        } catch (err) {
            throw new Error(`Failed to start container: ${err.message}`);
        }
    }

    async stopContainer(id) {
        try {
            const container = docker.getContainer(id);
            await container.stop();
            return { success: true, id };
        } catch (err) {
            throw new Error(`Failed to stop container: ${err.message}`);
        }
    }

    async deleteContainer(id) {
        try {
            const container = docker.getContainer(id);
            await container.remove({ force: true });
            return { success: true, id };
        } catch (err) {
            throw new Error(`Failed to delete container: ${err.message}`);
        }
    }

    async listImages(filters = {}) {
        try {
            const images = await docker.listImages({ filters });
            return images.map(img => ({
                id: img.Id.substring(0, 12),
                tags: img.RepoTags || ['<none>'],
                size: (img.Size / (1024 * 1024)).toFixed(2),
                created: img.Created,
            }));
        } catch (err) {
            throw new Error(`Failed to list images: ${err.message}`);
        }
    }

    async deleteImage(id) {
        try {
            const image = docker.getImage(id);
            await image.remove({ force: true });
            return { success: true, id };
        } catch (err) {
            throw new Error(`Failed to delete image: ${err.message}`);
        }
    }
}

module.exports = new DockerService();
