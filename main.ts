import { App, Plugin, PluginSettingTab, Setting, MarkdownPostProcessorContext } from 'obsidian';

interface CountdownSettings {
    projectName: string;
}

const DEFAULT_SETTINGS: CountdownSettings = {
    projectName: 'My Project'
};

export default class CountdownPlugin extends Plugin {
    settings: CountdownSettings;

    async onload() {
        await this.loadSettings();

        this.addSettingTab(new CountdownSettingTab(this.app, this));

        this.registerMarkdownCodeBlockProcessor('countdown', (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
            const countdownEl = el.createDiv({ cls: 'countdown-widget' });
            const headerEl = countdownEl.createDiv({ cls: 'countdown-header' });
            const projectNameEl = headerEl.createEl('h3', { cls: 'countdown-project-name' });
            const stagesEl = countdownEl.createDiv({ cls: 'countdown-stages' });

            const updateCountdown = () => {
                const lines = source.split('\n').map(line => line.trim()).filter(line => line !== '');
                const projectName = lines[0] || this.settings.projectName;
                const stages = lines.slice(1).map(line => {
                    const [stageName, stageDate] = line.split('|').map(part => part.trim());
                    return { name: stageName, date: stageDate };
                });

                projectNameEl.textContent = projectName;

                // Clear existing stages
                stagesEl.empty();

                stages.forEach(stage => {
                    const stageEl = stagesEl.createDiv({ cls: 'countdown-stage' });
                    const stageInfoEl = stageEl.createDiv({ cls: 'countdown-stage-info' });

                    const stageNameEl = stageInfoEl.createDiv({ cls: 'countdown-stage-name', text: stage.name });
                    const stageDueEl = stageInfoEl.createDiv({ cls: 'countdown-stage-due', text: `Due: ${new Date(stage.date).toLocaleString()}` });

                    const countdownTimeEl = stageEl.createDiv({ cls: 'countdown-time' });

                    const updateStageCountdown = () => {
                        const now = new Date();
                        const deadline = new Date(stage.date);

                        const distance = deadline.getTime() - now.getTime();

                        if (distance < 0) {
                            countdownTimeEl.textContent = 'Completed';
                            countdownTimeEl.addClass('completed');
                        } else {
                            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                            countdownTimeEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
                            countdownTimeEl.removeClass('completed');
                        }
                    };

                    // Initial update
                    updateStageCountdown();
                    // Update every second
                    this.registerInterval(window.setInterval(updateStageCountdown, 1000));
                });
            };

            updateCountdown();
        });
    }

    onunload() {
        // Any necessary cleanup can be done here
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class CountdownSettingTab extends PluginSettingTab {
    plugin: CountdownPlugin;

    constructor(app: App, plugin: CountdownPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Countdown Settings' });

        new Setting(containerEl)
            .setName('Default Project Name')
            .setDesc('Enter the default name of the project')
            .addText(text => text
                .setPlaceholder('Enter project name')
                .setValue(this.plugin.settings.projectName)
                .onChange(async (value: string) => {
                    this.plugin.settings.projectName = value;
                    await this.plugin.saveSettings();
                }));
    }
}