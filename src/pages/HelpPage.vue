<script setup lang="ts">
import { ExternalLink, MessageCircle } from 'lucide-vue-next'
</script>

<template>
  <div class="flex flex-col gap-8 p-8">
    <h2 class="text-lg font-semibold text-text-heading">{{ $t('help.title') }}</h2>

    <!-- About -->
    <section class="flex flex-col gap-3">
      <p class="text-sm text-text-light leading-relaxed">
        {{ $t('help.about') }}
      </p>
    </section>

    <!-- Useful links -->
    <section class="flex flex-col gap-3">
      <div class="flex items-center gap-2 text-sm font-medium text-text-light">
        <MessageCircle :size="16" />
        {{ $t('help.getHelp') }}
      </div>
      <ul class="flex flex-col gap-2">
        <li>
          <a
            href="https://github.com/woyta64/woyta-pad-frontend/issues"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors"
          >
            <ExternalLink :size="14" />
            {{ $t('help.reportBug') }}
          </a>
        </li>
        <li>
          <a
            href="https://github.com/woyta64/woyta-pad-firmware"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors"
          >
            <ExternalLink :size="14" />
            {{ $t('help.firmwareSource') }}
          </a>
        </li>
      </ul>
    </section>
  </div>
</template>