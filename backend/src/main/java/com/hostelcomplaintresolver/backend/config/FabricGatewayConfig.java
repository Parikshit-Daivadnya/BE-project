package com.hostelcomplaintresolver.backend.config;

import io.grpc.ManagedChannel;
import io.grpc.netty.shaded.io.grpc.netty.GrpcSslContexts;
import io.grpc.netty.shaded.io.grpc.netty.NettyChannelBuilder;
import org.hyperledger.fabric.client.Contract;
import org.hyperledger.fabric.client.Gateway;
import org.hyperledger.fabric.client.identity.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.io.Reader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.InvalidKeyException;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

@Configuration
public class FabricGatewayConfig {

    private static final String MSP_ID = "Org1MSP";
    private static final String CHANNEL_NAME = "hostelchannel";
    private static final String CHAINCODE_NAME = "hostel";

    // ✅ PATHS UPDATED TO D: DRIVE (Synced from WSL)
    private static final Path CRYPTO_PATH = Paths.get("D:", "BE_Project", "fabric-certificates", "organizations", "peerOrganizations", "org1.example.com");

    // ✅ Filename must match exactly what is in your signcerts folder
    private static final Path CERT_PATH = CRYPTO_PATH.resolve(Paths.get("users", "User1@org1.example.com", "msp", "signcerts", "cert.pem"));

    // ✅ Directory where the private key (_sk file) is located
    private static final Path KEY_DIR_PATH = CRYPTO_PATH.resolve(Paths.get("users", "User1@org1.example.com", "msp", "keystore"));

    // ✅ Path to the Peer TLS certificate for secure communication
    private static final Path TLS_CERT_PATH = CRYPTO_PATH.resolve(Paths.get("peers", "peer0.org1.example.com", "tls", "ca.crt"));

    private static final String PEER_ENDPOINT = "localhost:7051";
    private static final String OVERRIDE_AUTH = "peer0.org1.example.com";

    @Bean
    public Contract createContract() throws Exception {
        System.out.println("🔗 Connecting to Hyperledger Fabric Gateway...");

        // 1. Establish gRPC connection
        ManagedChannel channel = newGrpcConnection();

        // 2. Build the Gateway
        Gateway gateway = Gateway.newInstance()
                .identity(newIdentity())
                .signer(newSigner())
                .connection(channel)
                .evaluateOptions(options -> options.withDeadlineAfter(5, TimeUnit.SECONDS))
                .endorseOptions(options -> options.withDeadlineAfter(15, TimeUnit.SECONDS))
                .submitOptions(options -> options.withDeadlineAfter(5, TimeUnit.SECONDS))
                .commitStatusOptions(options -> options.withDeadlineAfter(1, TimeUnit.MINUTES))
                .connect();

        System.out.println("✅ Connected to Blockchain Channel: " + CHANNEL_NAME);

        return gateway.getNetwork(CHANNEL_NAME).getContract(CHAINCODE_NAME);
    }

    private ManagedChannel newGrpcConnection() throws IOException, CertificateException {
        var credentials = GrpcSslContexts.forClient()
                .trustManager(TLS_CERT_PATH.toFile())
                .build();

        return NettyChannelBuilder.forTarget(PEER_ENDPOINT)
                .sslContext(credentials)
                .overrideAuthority(OVERRIDE_AUTH)
                .build();
    }

    private Identity newIdentity() throws IOException, CertificateException {
        try (Reader certReader = Files.newBufferedReader(CERT_PATH)) {
            X509Certificate certificate = Identities.readX509Certificate(certReader);
            return new X509Identity(MSP_ID, certificate);
        }
    }

    private Signer newSigner() throws IOException, InvalidKeyException {
        // Automatically finds the first file in keystore (the random-named _sk file)
        try (Stream<Path> keyFiles = Files.list(KEY_DIR_PATH)) {
            Path keyPath = keyFiles.findFirst().orElseThrow(() ->
                    new IOException("No private key file found in " + KEY_DIR_PATH));

            try (Reader keyReader = Files.newBufferedReader(keyPath)) {
                var privateKey = Identities.readPrivateKey(keyReader);
                return Signers.newPrivateKeySigner(privateKey);
            }
        }
    }
}