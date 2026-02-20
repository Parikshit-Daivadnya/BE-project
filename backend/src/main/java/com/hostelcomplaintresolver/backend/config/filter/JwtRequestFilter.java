package com.hostelcomplaintresolver.backend.config.filter;

import com.hostelcomplaintresolver.backend.security.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;
        List<String> roles = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                // ✅ If these succeed, the token is valid (signed & not expired)
                username = jwtUtil.extractUsername(jwt);
                roles = jwtUtil.extractRoles(jwt);
            } catch (ExpiredJwtException e) {
                System.out.println("JWT Token has expired");
            } catch (SignatureException e) {
                System.out.println("JWT signature does not match locally computed signature.");
            } catch (MalformedJwtException e) {
                System.out.println("Invalid JWT Token format.");
            } catch (Exception e) {
                System.out.println("Error parsing JWT Token: " + e.getMessage());
            }
        }

        // ✅ Validate context
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Handle potential null roles to avoid NullPointerException
            if (roles == null) {
                roles = new ArrayList<>();
            }

            // Create authorities directly from token roles (No DB call needed)
            List<SimpleGrantedAuthority> authorities = roles.stream()
                    .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role) // Ensure ROLE_ prefix
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());

            // Set Authentication
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    username, null, authorities);

            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        chain.doFilter(request, response);
    }
}