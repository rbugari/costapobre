<template>
  <div class="help-container">
    <div class="help-header">
      <h2>{{ $t('help_title') }}</h2>
      <p>{{ $t('help_subtitle') }}</p>
    </div>

    <accordion :title="$t('help_content.history_concept_title')" :start-open="true">
      <p><strong>{{ $t('help_content.premise').split(':')[0] }}:</strong> {{ $t('help_content.premise').split(':')[1] }}</p>
      <p><strong>{{ $t('help_content.tone').split(':')[0] }}:</strong> {{ $t('help_content.tone').split(':')[1] }}</p>
      <p><strong>{{ $t('help_content.corrupt_mentor').split(':')[0] }}:</strong> {{ $t('help_content.corrupt_mentor').split(':')[1] }}</p>
    </accordion>

    <accordion :title="$t('help_content.gameplay_cycle_title')">
      <ol>
        <li><strong>{{ $t('help_content.spin_wheel').split(':')[0] }}:</strong> {{ $t('help_content.spin_wheel').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.choose_card').split(':')[0] }}:</strong> {{ $t('help_content.choose_card').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.narrate_plan').split(':')[0] }}:</strong> {{ $t('help_content.narrate_plan').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.evaluation').split(':')[0] }}:</strong> {{ $t('help_content.evaluation').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.ascension').split(':')[0] }}:</strong> {{ $t('help_content.ascension').split(':')[1] }}</li>
      </ol>
    </accordion>

    <accordion :title="$t('help_content.key_resources_title')">
      <ul>
        <li><strong>{{ $t('help_content.pc_description').split(':')[0] }}:</strong> {{ $t('help_content.pc_description').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.inf_description').split(':')[0] }}:</strong> {{ $t('help_content.inf_description').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.be_description').split(':')[0] }}:</strong> {{ $t('help_content.be_description').split(':')[1] }}</li>
      </ul>
    </accordion>

    <accordion :title="$t('help_content.scandal_events_title')">
      <p>{{ $t('help_content.scandal_trigger_description') }}</p>
      <ul>
        <li><strong>{{ $t('help_content.option_a_title').split(':')[0] }}:</strong> {{ $t('help_content.option_a_title').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.option_b_title').split(':')[0] }}:</strong> {{ $t('help_content.option_b_title').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.option_c_title').split(':')[0] }}:</strong> {{ $t('help_content.option_c_title').split(':')[1] }}</li>
      </ul>
    </accordion>

    <accordion :title="$t('help_content.monetization_title')">
      <p>{{ $t('help_content.monetization_intro') }}</p>
      <ul>
        <li><strong>{{ $t('help_content.premium_pass_description').split(':')[0] }}:</strong> {{ $t('help_content.premium_pass_description').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.scandal_rescue_description').split(':')[0] }}:</strong> {{ $t('help_content.scandal_rescue_description').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.rewarded_ads_description').split(':')[0] }}:</strong> {{ $t('help_content.rewarded_ads_description').split(':')[1] }}</li>
      </ul>
    </accordion>

    <accordion :title="$t('help_content.interface_guide_title')">
      <p>{{ $t('help_content.interface_intro') }}</p>
      <ul>
        <li><strong>{{ $t('help_content.tempt_fate_button').split(':')[0] }}:</strong> {{ $t('help_content.tempt_fate_button').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.record_voice_button').split(':')[0] }}:</strong> {{ $t('help_content.record_voice_button').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.execute_plan_button').split(':')[0] }}:</strong> {{ $t('help_content.execute_plan_button').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.use_wildcard_button').split(':')[0] }}:</strong> {{ $t('help_content.use_wildcard_button').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.edit_profile_button').split(':')[0] }}:</strong> {{ $t('help_content.edit_profile_button').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.history_button').split(':')[0] }}:</strong> {{ $t('help_content.history_button').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.help_button').split(':')[0] }}:</strong> {{ $t('help_content.help_button').split(':')[1] }}</li>
        <li><strong>{{ $t('help_content.exit_button').split(':')[0] }}:</strong> {{ $t('help_content.exit_button').split(':')[1] }}</li>
      </ul>
    </accordion>

    <accordion :title="$t('help_content.copyright_title')">
      <p>{{ $t('help_content.copyright_text') }}</p>
    </accordion>

    <button @click="goBackToGame" class="back-button">{{ $t('back_to_game') }}</button>
  </div>
</template>

<script>
import Accordion from '../components/Accordion.vue';

export default {
  name: 'Help',
  components: {
    Accordion,
  },
  methods: {
    goBackToGame() {
      this.$router.push('/game');
    },
  },
};
</script>

<style scoped>
.help-container {
  max-width: 900px;
  margin: 20px auto;
  padding: 20px;
  color: var(--noir-retro-pure-black);
}

.help-header {
  text-align: center;
  margin-bottom: 30px;
}

.help-header h2 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 2.8em;
  color: var(--noir-retro-primary-accent);
  margin: 0;
}

.help-header p {
  font-family: 'Roboto', sans-serif;
  font-size: 1.2em;
  color: var(--noir-retro-dark-grey);
}

.help-container ol,
.help-container ul {
  padding-left: 20px;
}

.help-container li {
  margin-bottom: 10px;
}

.back-button {
  display: block;
  width: 50%;
  margin: 40px auto 0 auto;
  padding: 15px 20px;
  font-size: 1.2em;
  /* Utiliza las clases de botones globales si existen, o define estilos aquí */
  background-color: var(--noir-retro-secondary-accent);
  color: var(--noir-retro-off-white);
  border: 2px solid var(--noir-retro-pure-black);
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  transition: all 0.2s ease;
}

.back-button:hover {
  background-color: #226A6D;
  transform: translateY(-2px);
}
</style>