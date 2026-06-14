// Simple singleton registry for the ChannelSimulator used by API routes
import ChannelSimulator from '@/lib/services/channel-simulator';

// Export a default simulator instance with defaults; tests or debug routes can replace this
const simulator = new ChannelSimulator();

export default simulator;
