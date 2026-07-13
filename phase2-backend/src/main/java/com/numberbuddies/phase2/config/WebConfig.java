package com.numberbuddies.phase2.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableConfigurationProperties(AppProperties.class)
public class WebConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource(AppProperties appProperties) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedHeaders(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setMaxAge(3600L);

        String origins = appProperties.getCors().getAllowedOrigins();
        if (origins != null && !origins.isBlank()) {
            List<String> originPatterns = Arrays.stream(origins.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            config.setAllowedOriginPatterns(originPatterns);
        } else {
            config.setAllowedOriginPatterns(List.of("*"));
        }

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public CorsFilter corsFilter(CorsConfigurationSource corsConfigurationSource) {
        return new CorsFilter(corsConfigurationSource);
    }
}

