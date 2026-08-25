package com.nlufood.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                InputStream serviceAccount = getClass().getClassLoader().getResourceAsStream("firebase-service-account.json");
                
                FirebaseOptions options;
                if (serviceAccount != null) {
                    options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                            .setDatabaseUrl("https://nlufood-app.firebaseio.com")
                            .build();
                } else {
                    options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.newBuilder().build())
                            .setProjectId("nlufood-app")
                            .build();
                }
                
                FirebaseApp.initializeApp(options);
                System.out.println(">> Firebase Admin SDK initialized successfully.");
            }
        } catch (Exception e) {
            System.out.println(">> Firebase initialization note: " + e.getMessage() + " (Running with local fallback mode).");
        }
    }
}
